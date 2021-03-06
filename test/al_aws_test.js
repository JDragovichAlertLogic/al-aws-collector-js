const assert = require('assert');
const rewire = require('rewire');
const sinon = require('sinon');
const m_alAws = require('../al_aws');
const colMock = require('./collector_mock');
var AWS = require('aws-sdk-mock');

const alAwsRewire = rewire('../al_aws');

describe('al_aws Tests', function() {
    describe('arnToName() tests', function(done) {
        it('Valid input', function(done) {
            assert.equal(m_alAws.arnToName('arn:aws:iam::123456789101:role/testRole'), 'testRole');
            assert.equal(m_alAws.arnToName('arn:aws:kinesis:us-east-1:123456789101:stream/test-KinesisStream'), 'test-KinesisStream');
            assert.equal(m_alAws.arnToName('arn:aws:sqs:us-east-1:352283894008:testSqs'), 'testSqs');
            assert.equal(m_alAws.arnToName('arn:aws:s3:::teambucket'), 'teambucket');
            done();
        });
        
        it('Invalid input', function(done) {
            assert.ifError(m_alAws.arnToName(''));
            assert.ifError(m_alAws.arnToName('invalid'));
            assert.ifError(m_alAws.arnToName('arn:aws:invalid'));
            done();
        });
    });
    
    describe('arnToAccId() tests', function(done) {
        it('Valid input', function(done) {
            assert.equal(m_alAws.arnToAccId('arn:aws:iam::123456789101:role/testRole'), '123456789101');
            assert.equal(m_alAws.arnToAccId('arn:aws:kinesis:us-east-1:123456789101:stream/test-KinesisStream'), '123456789101');
            assert.equal(m_alAws.arnToAccId('arn:aws:sqs:us-east-1:352283894008:testSqs'), '352283894008');
            assert.equal(m_alAws.arnToAccId('arn:aws:s3:::teambucket'), '');
            done();
        });
        
        it('Invalid input', function(done) {
            assert.ifError(m_alAws.arnToAccId(''));
            assert.ifError(m_alAws.arnToAccId('invalid'));
            assert.ifError(m_alAws.arnToAccId('arn:aws:invalid'));
            done();
        });
    });
    
    describe('getS3ConfigChanges() function', () => {
        var rewireGetS3ConfigChanges = alAwsRewire.__get__('getS3ConfigChanges');
        var jsonCfg = "{\"key\":\"value\"}";
        var s3Object = {Body: new Buffer(jsonCfg)};
    
        afterEach(() => {
            AWS.restore('S3', 'getObject');
            process.env.aws_lambda_update_config_name = colMock.S3_CONFIGURATION_FILE_NAME;
        });
    
        it('sunny case with predefined name', () => {
            AWS.mock('S3', 'getObject', (params, callback) => {
                assert.equal(params.Bucket, colMock.S3_CONFIGURATION_BUCKET);
                assert.equal(params.Key, colMock.S3_CONFIGURATION_FILE_NAME);
                return callback(null, s3Object);
            });
    
            rewireGetS3ConfigChanges((err, config) => {
                assert.equal(jsonCfg, JSON.stringify(config));
            });
        });
    
        it('error', () => {
            AWS.mock('S3', 'getObject', (params, callback) => {
                assert.equal(params.Bucket, colMock.S3_CONFIGURATION_BUCKET);
                assert.equal(params.Key, colMock.S3_CONFIGURATION_FILE_NAME);
                return callback("key not found error");
            });
    
            rewireGetS3ConfigChanges((err, config) => {
                assert.equal("key not found error", err);
            });
        });
    });
    
    describe('getLambdaConfig() function', () => {
        var rewireGetLambdaConfig = alAwsRewire.__get__('getLambdaConfig');
        after(() => {
            AWS.restore('Lambda', 'getFunctionConfiguration');
        });
    
        it('check function anme', () => {
            AWS.mock('Lambda', 'getFunctionConfiguration', (params, callback) => {
                assert.equal(colMock.FUNCTION_NAME, params.FunctionName);
                return callback(null, "ok");
            });
    
            rewireGetLambdaConfig((err, config) => {
                assert.equal("ok", config);
            });
        });
    });
});


