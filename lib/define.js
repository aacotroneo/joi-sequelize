'use strict'; // jshint ignore:line
var _ = require('lodash');
var joi = require('joi');

module.exports = function (modelName, schema) {
  this._schema = schema;
  this._modelName = modelName;
  this.isString = [];

  _.map(schema, (attr, key) => {
    let schema = attr.isJS ? attr : attr.type;

    if (attr instanceof Function) schema = attr();
    if (schema instanceof Function) schema = schema();

    if (!schema.type) throw new Error('Schema must have a type');

    if(attr.allowNull === false){
      this._allowNull.push(key);
    }

    this._types[key] = {
      original: schema.type,
      query: schema.type,
    };

    switch (schema.type){
      case 'array':
        this._joi[key] = joi.array();
        break;
      case 'biginteger':
        this._joi[key] = joi.number().integer();
        break;
      case 'boolean':
        this._joi[key] = joi.boolean();
        break;
      case 'date':
        this._joi[key] = joi.date();
        if (attr.iso) this._joi[key] = this._joi[key].iso();
        if (attr.format) this._joi[key] = this._joi[key].format(attr.format);
        break;
      case 'dateonly':
        this._joi[key] = joi.date();
        if (attr.format) this._joi[key] = this._joi[key].format(attr.format);
        break;
      case 'decimal':
        this._joi[key] = joi.number();
        if (schema.precision) this._joi[key] = this._joi[key].precision(schema.precision);
        break;
      case 'double':
        this._joi[key] = joi.number();
        if (schema.precision) this._joi[key] = this._joi[key].precision(schema.precision);
        break;
      case 'string':
        this._joi[key] = joi.string();
        if (schema.max) this._joi[key] = this._joi[key].max(schema.max);
        break;
      case 'enum':
        if (!schema.values) throw new Error('Enum must define it types');
        this._joi[key] = joi.string();
        if (attr.allowNull || !attr.hasOwnProperty('allowNull')) {
          this._joi[key] = this._joi[key].valid(_.concat(null, schema.values));
        } else {
          this._joi[key] = this._joi[key].valid(schema.values);
        }

        break;
      case 'float':
        this._joi[key] = joi.number();
        if (schema.precision) this._joi[key] = this._joi[key].precision(schema.precision);
        break;
      case 'real':
        this._joi[key] = joi.number();
        if (schema.precision) this._joi[key] = this._joi[key].precision(schema.precision);
        break;
      // case 'range': // needs to be thinked
      //   this._joi[key] = joi.string().integer();
      //   break;
      case 'geometry':
        this._joi[key] = joi.object({
          type: joi.string().valid(['POINT', 'LINESTRING', 'POLYGON']),
          coordinates: joi.array(),
          crs: joi.object(),
        });
        break;
      case 'integer':
        this._joi[key] = joi.number().integer();
        break;
      case 'text':
        this._joi[key] = joi.string();
        break;
      case 'uuid':
        this._joi[key] = joi.string().length(36);
        break;
      case 'json':
      case 'jsonb':
      default:
        this._joi[key] = joi.any();
    }

    if (attr.validate) {
      var val = attr.validate;
      if (val.isEmail){
        this._joi[key] = this._joi[key].email()
      }
      if (val.len){
        this._joi[key] = this._joi[key].min(val.len[0]).max(val.len[1]);
      }
      if (val.isUrl) {
        this._joi[key] = this._joi[key].uri()

      }
        // is: ["^[a-z]+$",'i'],     // will only allow letters
        // is: /^[a-z]+$/i,          // same as the previous example using real RegExp
        // not: ["[a-z]",'i'],       // will not allow letters
        // isUrl: true,              // checks for url format (http://foo.com)
        // isIP: true,               // checks for IPv4 (129.89.23.1) or IPv6 format
        // isIPv4: true,             // checks for IPv4 (129.89.23.1)
        // isIPv6: true,             // checks for IPv6 format
        // isAlpha: true,            // will only allow letters
        // isAlphanumeric: true,     // will only allow alphanumeric characters, so "_abc" will fail
        // isNumeric: true,          // will only allow numbers
        // isInt: true,              // checks for valid integers
        // isFloat: true,            // checks for valid floating point numbers
        // isDecimal: true,          // checks for any numbers
        // isLowercase: true,        // checks for lowercase
        // isUppercase: true,        // checks for uppercase
        // notNull: true,            // won't allow null
        // isNull: true,             // only allows null
        // notEmpty: true,           // don't allow empty strings
        // equals: 'specific value', // only allow a specific value
        // contains: 'foo',          // force specific substrings
        // notIn: [['foo', 'bar']],  // check the value is not one of these
        // isIn: [['foo', 'bar']],   // check the value is one of these
        // notContains: 'bar',       // don't allow specific substrings
        // len: [2,10],              // only allow values with length between 2 and 10
        // isUUID: 4,                // only allow uuids
        // isDate: true,             // only allow date strings
        // isAfter: "2011-11-05",    // only allow date strings after a specific date
        // isBefore: "2011-11-05",   // only allow date strings before a specific date
        // max: 23,                  // only allow values
        // min: 23,                  // only allow values >= 23
        // isArray: true,            // only allow arrays
        // isCreditCard: true,       // check for valid credit card numbers

    }

    if ((attr.allowNull || !attr.hasOwnProperty('allowNull')) && schema.type !== 'enum') {
      if(schema.type==='string'){
        this._joi[key] = this._joi[key].allow([null, '']);
      }else{
        this._joi[key] = this._joi[key].allow(null);
      }
    }

    if (attr.description) {
      this._joi[key] = this._joi[key].description(attr.description);
    }
  });
};
