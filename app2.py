from flask import Flask, render_template, redirect, url_for, Response, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
import requests
import json
from pymongo import MongoClient
from gridfs import GridFS
from bson import objectid, json_util, BSON
import census2 as ce



years= ['1986','1988','1990','1992','1994','1996','1998','2000','2002','2004','2006','2008','2010','2012','2014','2016','2017','2018']

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

    # Get county codes
    ctdata = jsonify(data)
    print(ctdata)

    return jsonify(data)

@app.route("/reload_geo", methods=["GET"])
def reload_geo():
    # check to see if there is an exisitng file.  If so than do not reload
    col = db.fs.files.find_one()

    status = "existing"

    if col == None:

        response = requests.get("https://opendata.arcgis.com/datasets/d192da4d0ac249fa9584109b1d626286_0.geojson")

        # GridFS stored BSON binary files, the fucntion to do that is BSON.encode
        geojson = BSON.encode(response.json())

        # then we store it with the put()
        fs.put(geojson)

        # set the status
        status = "new"

    return status


@app.route("/reload_census", methods=["GET"])
@cross_origin()
def reload_census():
    #years= ['1986','1988','1990','1992','1994','1996','1998','2000','2002','2004','2006','2008','2010','2012','2014','2016','2017','2018']

    # censusyears = mongo.db.censusyr
    # doc = censusyears.find_one()
    # yearBson = json.loads(json_util.dumps(doc))
    # print(yearBson)
    # yearjson = jsonify(yearBson)
 
    # Build DB for all counties by years
    censuscol = mongo.db.census
    
    for year in years:
        myquery = { "year": year }
        x = censuscol.count_documents(myquery)
        if x == 0:
            responseJson = ce.emp_by_year(int(year))
            censusyear = {"year": year, "result" : responseJson}
            censuscol.insert(censusyear)
            result = "new"
        else:  # don't refresh if we have the data.  Eventually we would want to change this
            result = "existing"

    return result


@app.route("/get_census/<year>", methods=['GET'])
@cross_origin()
def get_census(year):

    censuscol = mongo.db.census
    myquery = { "year": year }
    x = censuscol.count_documents(myquery)
    if x == 0:  # need to change to call refresh
        result = "none"
    else:
        censusdoc = censuscol.find_one(myquery)
        censusjson = json.loads(json_util.dumps(censusdoc))
        result = jsonify(censusjson)
    return result

@app.route("/get_county_data/<county>", methods=['GET'])
@cross_origin()
def get_county_data(county):
    censuscol = mongo.db.census
    
    censusjson = json.loads(json_util.dumps(censusdoc))

    return jsonify(censusjson)

@app.route("/get_years", methods=['GET'])
@cross_origin()
def get_years():

    # censusyears = mongo.db.censusyr
    # doc = censusyears.find_one()
    # yearjson = json.loads(json_util.dumps(doc))
    # print(yearjson)
    print(years)
    return jsonify(years)

if __name__ == "__main__":
    app.run()
