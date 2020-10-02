from flask import Flask, render_template, redirect, url_for, Response, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
import requests
import json
from pymongo import MongoClient
from gridfs import GridFS
from bson import objectid, json_util, BSON
import census as ce



years= ['1986','1988','1990','1992','1994','1996','1998','2000','2002','2004','2006','2008','2010','2012','2013','2014','2015','2016','2017','2018']
recent_years= ['2012', '2013','2014','2015','2016','2017','2018']

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

def deter_county(result,county,year):
    size = 0
    ind = 1
    name_ind = 0
    cnty = ""
    first_data_row = 1
    code = "none"
    split_char = ' '
    year_int = int(year)
    if (year_int >= 2017):
        code = '00'
    elif (year_int >= 2012):
        code = '00'
    elif (year_int > 2007):
        name_ind = 1
        ind=2
    elif (year_int >= 2002):
        name_ind = 1
        ind=2
        split_char = ','
    elif (year_int > 1997):
        name_ind = 1
        ind=2

    cnty = county + split_char + result[first_data_row][name_ind].split(split_char,1)[1]
    for county_d in result:
        if (code == "none"):
            if(cnty == county_d[name_ind]):
                size = int(county_d[ind])
                break
        elif (cnty == county_d[name_ind] and code == county_d[2]):
            size = int(county_d[ind])
            break

    return size
      
        
#This is not recommended in production
#What would happen is every time you visit the root route it would load the DB again with all the data
#
@app.route("/get_geo", methods=["GET"])
def get_geo():

    #to acces the data first we need to get the colletion in where the files are stored
    col = db.fs.files.find_one()
    # once we have the object storing the file information, we can get the data and read it
    bsdata = fs.get(col["_id"]).read()
    # since the data was encode, we need to decode it back
    data = BSON.decode(bsdata)
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
 
    censuscol = mongo.db.census
#    test = ['2012','2018']

    for year in years:
        myquery = { "year": year }
        x = censuscol.count_documents(myquery)
        print("In APPPP:::",year,x)
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
    result = []
#    test = ['2002','2004']
    for year in years:
        censuscol = mongo.db.census
        myquery = { "year": year }
        x = censuscol.count_documents(myquery)
        if x == 0:  # pull the county information
            result.append(0)
        else:
            censusdoc = censuscol.find_one(myquery,{ "_id": 0, "result": 1 })
            censusjson = json.loads(json_util.dumps(censusdoc))
            result.append(deter_county(censusjson['result'],county,year))
    county_info = {"year" : years,
                    "size": result}
    return jsonify(county_info)

@app.route("/get_nc_data/", methods=['GET'])
@cross_origin()
def get_nc_data():
    sector = False
    ind = 3
    eind = 1
    result = []

#    test = ['2002','2004']
    for year in years:
        # there is no '999' entry for 2017,2018
        if int(year) >= 2017:
            break
        
        censuscol = mongo.db.census
        myquery = { "year": year }
        x = censuscol.count_documents(myquery)
        if x == 0:  # pull the county information
            result.append(0)
        else:
            censusdoc = censuscol.find_one(myquery,{ "_id": 0, "result": 1 })
            censusjson = json.loads(json_util.dumps(censusdoc))

            if (int(year) >= 1998):
                ind = 4
                eind = 2
                if (int(year) >= 2012 ):
                    sector = True
                    eind = 1           
            
            empdata = censusjson['result']

            #Take the total employee number, i.e., when sector number=00
            
            if (sector):
                selData = list(filter(lambda d: (d[ind] == '999') & (d[2] == '00'), empdata))
            else:
                selData = list(filter(lambda d: d[ind] == '999', empdata))

            # Append data to array
            result.append( [ year, selData[0][eind] ] )
            
    return jsonify(result)

@app.route("/get_years", methods=['GET'])
@cross_origin()
def get_years():

    #return jsonify(years)
    return jsonify(recent_years)

if __name__ == "__main__":
    app.run()