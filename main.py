from flask import Flask, render_template, redirect, url_for, Response, jsonify
from bson import json_util
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
import requests
import json


app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": "*"
    }
})
app.config['CORS_HEADERS'] = 'Content-Type'
app.config['CORS_ORIGINS'] = '*'
# Use flask_pymongo to set up mongo connection

# temporary mongo DB
app.config["MONGO_URI"] = "mongodb://localhost:27017/censusdb"

mongo = PyMongo(app)

#This is not recommended in production
#What would happen is every time you visit the root route it would load the DB again with all the data
#
@app.route("/get_geo", methods=["GET"])
def reload_geo():
    #geocol = mongo.db.geo 
    response = requests.get("https://opendata.arcgis.com/datasets/d192da4d0ac249fa9584109b1d626286_0.geojson")

    geojson = json.loads(json_util.dumps(response.json()))
    return jsonify(geojson)

@app.route("/reload_census", methods=["GET"])
def reload_census():
    censuscol = mongo.db.census
    response = requests.get("https://api.census.gov/data/1986/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37")
    print(response.json())
    responseJson = response.json()
    censusyear = {"year" : 1986, "result" : responseJson}
    censuscol.insert(censusyear)
    return "finished"



@app.route("/get_census", methods=['GET'])
@cross_origin()
def allbreeds():
    censuscol = mongo.db.census
    censusdoc = censuscol.find_one()
    censusjson = json.loads(json_util.dumps(censusdoc))
    return jsonify(censusjson)

if __name__ == "__main__":
    app.run()
