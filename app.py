from flask import Flask, render_template, redirect, url_for, Response, jsonify
from flask_pymongo import PyMongo
from flask_cors import CORS, cross_origin
import requests
import json
from pymongo import MongoClient
from gridfs import GridFS
from bson import objectid, json_util, BSON
import census as ce
import csv 



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
        if x == 0:
            responseJson = ce.emp_by_year(int(year))
            censusyear = {"year": year, "result" : responseJson}
            censuscol.insert(censusyear)
            result = "new"
        else:  # don't refresh if we have the data.  Eventually we would want to change this
            result = "existing"

    return result


@app.route("/reload_nccensus", methods=["GET"])
@cross_origin()
def reload_nccensus():
 
    censuscol = mongo.db.nccensus
#    test = ['2012','2018']

    for year in years:
        myquery = { "year": year }
        x = censuscol.count_documents(myquery)
        if x == 0:
            responseJson = ce.emp_by_year_NC(int(year))
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

# For given year(2012~), return state-wide employees of each sector
@app.route("/get_nc_data/<year>", methods=['GET'])
@cross_origin()
def get_nc_data(year):

    censuscol = mongo.db.nccensus
    myquery = { "year": year }
    x = censuscol.count_documents(myquery)
    if x == 0:  # need to change to call refresh
        result = "none"
    else:
        censusdoc = censuscol.find_one(myquery)
        censusjson = json.loads(json_util.dumps(censusdoc))
        result = jsonify(censusjson)
    return result

# Return total employee numbers of NC of from 1986 to the given year
@app.route("/get_nc_total/<year>", methods=['GET'])
@cross_origin()
def get_nc_total(year):
    # set the index
    # sector : sub sectors exist or not
    # cind : county index
    # ein : emp index
    # nind : nicas code index
    sector = False
    eind = 1
    nind = 2
    yrs = []
    result = []

#    test = ['2002','2004']
    for yr in years:
        
        if int(yr) > int(year):
            break

        censuscol = mongo.db.nccensus
        myquery = { "year": yr }
        x = censuscol.count_documents(myquery)
        if x == 0:  # pull the county information
            result.append(0)
        else:
            censusdoc = censuscol.find_one(myquery,{ "_id": 0, "result": 1 })
            censusjson = json.loads(json_util.dumps(censusdoc))

            if (int(yr) > 1997):
                eind = 2
            if (int(yr) >= 2012 ):
                sector = True
                eind = 1           
            
            if (sector):
                ncemp = censusjson['result']
                selData = list(filter(lambda d: d[nind] == '00', ncemp))
                result.append( selData[0][eind]  )
                #print("yr: ", yr, selData)
            else:
                selData = censusjson['result'][1]
                result.append( selData[eind]  )
                #print("yr: ", yr, selData)

            # Append data to array
            yrs.append(yr)
            

    nc_info = {"year" : yrs,
                "size": result}  

    return jsonify(nc_info)
    
@app.route("/get_years", methods=['GET'])
@cross_origin()
def get_years():

    #return jsonify(years)
    return jsonify(recent_years)

@app.route("/get_population/<year>/<county>", methods=['GET'])
#@app.route("/get_population/<year_county>", methods=['GET'])
@cross_origin()
def get_population(year, county):

    """
    # set the population to 0 as the default
    population = 0
    # the data starts with year 2010 and the index of 1.  Subtract 2009 from the years to get index
    # into the list item.
    year_index = int(year) - 2009


    # opening the CSV file
    with open('./datasets/countytotals_2010_2019.csv', mode='r')as file:

        # reading the CSV file
        csvFile = csv.reader(file)

        # loop throughthe file to find the county or full state depending on the input request.
        for lines in csvFile:

            # The first item of the list is the name of the county or the word STATE.
            if county == lines[0]:
                population = lines[year_index]
            
    return jsonify(population)
    """
    #input_str = year_county.split('-')
    #year = input_str[0]
    #county = input_str[1]
    with open("./datasets/counties_pop_1990_2019.csv") as cfile:
        pp_data = csv.reader(cfile)
        next(pp_data)
        sel_pop = list(filter(lambda d: (d[1] == county) & (int(d[0])<=int(year)), pp_data))
        sel_pop.sort(key=lambda d:d[0])
        print(sel_pop)
        yrs = []
        vls = []
        for yr in years:
            if int(yr) > int(year):
                break
            if int(yr) < 1990:
                yrs.append(yr)
                vls.append(sel_pop[0][2])
                print(yr, sel_pop[0])
            elif int(yr) < 2000:
                yrs.append(yr)
                vls.append(sel_pop[1][2])
                print(yr, sel_pop[1])
            else:
                yrs.append(yr)
                yr_pop = list(filter(lambda d: d[0] == yr, sel_pop))
                print(yr, yr_pop)
                vls.append(yr_pop[0][2])
        pop_info = {
            'year': yrs,
            'size': vls
        }
    return jsonify(pop_info)
        

@app.route("/get_pop/<year>", methods=['GET'])
@cross_origin()
def get_pop(year):
    # the data starts with year 2010 and the index of 1.  Subtract 2009 from the years to get index
    # into the list item.
    year_index = int(year) - 2009
    result = {}
    # opening the CSV file
    with open('./datasets/countytotals_2010_2019.csv', mode='r')as file:

        # reading the CSV file
        csvFile = csv.reader(file)

        # skip the initial line
        next(csvFile)
        next(csvFile)
        next(csvFile)
        next(csvFile)

        for lines in csvFile:

           #put the data into a dioctionary

           result[lines[0]] = lines[year_index]
            
    return jsonify(result)

@app.route("/get_combined_codes", methods=['GET'])
@cross_origin()
def get_combined_codes():

    with open('./datasets/combined_county_codes.json', mode='r')as file:

        # Reading from json file 
        json_object = json.load(file) 

    return json_object

if __name__ == "__main__":
    app.run()
