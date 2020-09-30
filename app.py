from flask import Flask, render_template, redirect, url_for, Response, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
import requests
import json
from pymongo import MongoClient
from gridfs import GridFS
from bson import objectid, json_util, BSON
import importlib

moduleName = 'census'
importlib.import_module(moduleName)


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

# run in debug mode
app.debug = True

mongo = PyMongo(app)

years = []
db = MongoClient().mygrid 
fs = GridFS(db)

def order_list(censusJson):
    ord = {}
    # put the array into a dictionary format for easier reference in JS
    for ci in censusJson:
        # get the county name as the key
        ckey = ci[0].split()[0]
        ord[ckey] = ci
        
    return ord



#This is not recommended in production
#What would happen is every time you visit the root route it would load the DB again with all the data
#
@app.route("/get_geo", methods=["GET"])
def get_geo():
    """geocol = mongo.db.geo 

    geodoc = geocol.find_one()
    geojson = json.loads(json_util.dumps(geodoc))"""
    #to acces the data first we need to get the colletion in where the files are stored
    col = db.fs.files.find_one()
    # once we have the object storing the file information, we can get the data and read it
    bsdata = fs.get(col["_id"]).read()
    # since the data was encode, we need to decode it back
    data = BSON.decode(bsdata)
    return jsonify(data)

@app.route("/reload_geo", methods=["GET"])
def reload_geo():
    response = requests.get("https://opendata.arcgis.com/datasets/d192da4d0ac249fa9584109b1d626286_0.geojson")

    # GridFS stored BSON binary files, the fucntion to do that is BSON.encode
    geojson = BSON.encode(response.json())

    # then we store it with the put()
    fs.put(geojson)

    #geocol.insert_one(geojson)

    return "loaded"

@app.route("/get2_geo", methods=["GET"])
def get2_geo():
    #geocol = mongo.db.geo 
    response = requests.get("https://opendata.arcgis.com/datasets/d192da4d0ac249fa9584109b1d626286_0.geojson")

    geojson = response.json()

    #geocol.insert_one(geojson)

    return jsonify(geojson)

@app.route("/reload_census", methods=["GET"])
@cross_origin()
def reload_census():
    year = '1986'
    censuscol = mongo.db.census
    censuslink = "https://api.census.gov/data/" + year + "/cbp?get=GEO_TTL,SIC_TTL,EMP,ESTAB&for=county:*&in=state:37"
    response = requests.get(censuslink)
    responseJson = response.json()
    # print(responseJson)
    #orderJson = order_list(responseJson)
    # print(orderJson)
    censusyear = {"year": year, "result" : responseJson}
    myquery = { "year": year }
    x = censuscol.count_documents(myquery)
    #x = censuscol.find(myquery)
    print(x)
    if x == 0:
        censuscol.insert(censusyear)
        years.append(year)
        result = "new"
    else:
        newvalues = { "$set": { "result": responseJson } }
        censuscol.update(myquery,newvalues)
        result = "update"
    return result



@app.route("/get_census", methods=['GET'])
@cross_origin()
def get_census():
    censuscol = mongo.db.census
    censusdoc = censuscol.find_one()
    censusjson = json.loads(json_util.dumps(censusdoc))
    return jsonify(censusjson)

@app.route("/get_county_data", methods=['GET'])
@cross_origin()
def get_county_data():
    censuscol = mongo.db.census
    censusdoc = censuscol.find_one({"year" : years[0]})
    censusjson = json.loads(json_util.dumps(censusdoc))

    return jsonify(censusjson)

if __name__ == "__main__":
    app.run()
