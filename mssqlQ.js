/**
 * Created by LinYong on 2015-01-21.
 */
'use strict';

var sql = require('mssql');
var q = require("q");
var mssqlQ = function (config) {
    this.connected = false;
    this.connection = null;
    this.reconnects = 0;
    this.maxReconnects=10000;
    this.init(config);
}

mssqlQ.prototype.init = function (config) {
    var deferred = q.defer();
    var self = this;
    try {
        self.connection = new sql.Connection(config);
        self.connection.on('connect', function () {
            console.log("数据库连接成功！");
            self.connected = true;
            self.reconnects = 0;
        });
        self.connection.on('close', function () {
            self.connected = false;
            console.log("数据库连接关闭");
        });
        self.connection.on('error', function (err) {
            self.connected = false;
            console.log("数据库连接错误:",err);
        });
        deferred.resolve("数据库初始化成功！");
    } catch (ex) {
        deferred.reject("数据库初始化连接驱动错误！");
    }

    return deferred.promise;
}

mssqlQ.prototype.connect = function(){
    var deferred = q.defer();
    var self = this;
    self.connection.connect(function (err) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve("创建数据库连接成功！");
        }
    });
    return deferred.promise;
}

mssqlQ.prototype.close = function () {
    var deferred = q.defer();
    var self = this;
    try {
        self.connection.close();
        deferred.resolve("断开数据库连接成功！");
    } catch (err) {
        deferred.reject(err);
    }
    return deferred.promise;
}

mssqlQ.prototype.NoneDataQuery = function (sqlstr) {
    var deferred = q.defer();
    var self = this;
    self.Query(sqlstr).then(function (data) {
        deferred.resolve(true);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}

mssqlQ.prototype.DataQuery = function (sqlstr) {
    var deferred = q.defer();
    var self = this;
    self.Query(sqlstr).then(function (data) {
        deferred.resolve(data);
    }, function (err) {
        deferred.reject(err);
    });
    return deferred.promise;
}


mssqlQ.prototype.Query = function (sqlstr,def) {
    var deferred  = def || q.defer();
    var self = this;
    if (self.connected) {
        var request = new sql.Request(self.connection);
        request.query(sqlstr, function (err, recordset) {
            if (err) {
                deferred.reject(err);
            } else {

                deferred.resolve(recordset);
            }
        });

    } else {
        console.log("数据库连接失效，尝试重新连接");
        self.connect().then(function () {
            return self.Query(sqlstr,deferred);
        }, function (err) {
            return q.delay(1000).then(function () {
                return self.Query(sqlstr,deferred);
            });
        });
    }
    return deferred.promise;
}

module.exports=mssqlQ;



