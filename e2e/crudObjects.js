const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let objectId;
let resourceId;

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validObject = {
    "name": "TestObject 1",
    "regionId": 2,
    "district": "Центрально-северно-южный с намеком на восток",
    "organizationName": "ООО Рога кота и копыта собаки"
};

const updatedObject = {
    "name": "TestObject 2",
    "regionId": 1,
    "district": "Центрально-северно-южный с намеком на zapad",
    "organizationName": "ООО Рога собаки и копыта кота"
};

const invalidObject = {
    "name": "TestObject 1",
    "regionId": 1111,
    "organizationName": "ООО Рога кота и копыта собаки"
};

describe('Crud объектов', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();

        let response = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(correctCredentials);
        adminToken = response.body.data.user.accessToken;

        let resource = await request
            .post(`/xx-api/v1/resources`)
            .set({"Authorization-Header-Custom": adminToken})
            .attach('file', 'e2e/korgo.jpg');
        resourceId = resource.body.data.id;
        validObject.resourceIds = [resourceId];
        updatedObject.resourceIds = [resourceId];
    });

    after(() => {
        request.close();
    });

    describe('Create object', async () => {
        it('Запрос на создание объекта с токеном админа, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validObject);
            objectId = response.body.data.id;
            expect(response).to.have.status(200);
            expect(response.body.data).to.have.all.keys(
                'createdAt',
                'updatedAt',
                'id',
                'name',
                'district',
                'organizationName',
                'regionId',
                'state',
                'createdBy',
                'updatedBy',
                'region',
                'resources');
            expect(response.body.data.name).to.equal("TestObject 1");
            expect(response.body.data.regionId).to.equal(validObject.regionId);
            expect(response.body.data.district).to.equal("Центрально-северно-южный с намеком на восток");
            expect(response.body.data.organizationName).to.equal("ООО Рога кота и копыта собаки");
        });
        it('Запрос на создание объекта с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(validObject);
            expect(response).to.have.status(401);
        });
        it('Запрос на создание объекта с невалидными данными, ожидается 400', async () => {
            let response = await request
                .post(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidObject);
            expect(response).to.have.status(400);
        });
    });

    describe('Read object', async () => {
        it('Запрос на получение списка объектов с токеном админа, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items[0].id).to.not.null;
        });

        it('Запрос на получение объекта токеном админа, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/objects/?filter=id%20eq%20${objectId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items[0].id).to.equal(objectId); //проверка соответствия id возвращенного элемента
        });

        it('Запрос на получение списка объектов с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .get(`/xx-api/v1/objects`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Запрос на получение несуществующего объекта, ожидается пустой массив items', async () => {
            let response = await request
                .get(`/xx-api/v1/objects/?filter=id%20eq%201488`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items.length).to.equal(0);
        });
    });

    describe('Update object', async () => {
        it('Запрос на изменение объекта с токеном админа, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/objects/${objectId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedObject);
            expect(response).to.have.status(200);
            expect(response.body.data.id).to.equal(objectId);
            expect(response.body.data.district).to.equal(updatedObject.district);
            expect(response.body.data.name).to.equal(updatedObject.name);
            expect(response.body.data.regionId).to.equal(updatedObject.regionId);
            expect(response.body.data.organizationName).to.equal(updatedObject.organizationName);
            expect(response.body.data).to.have.keys(
                'updatedAt',
                'createdAt',
                'createdAt',
                'updatedAt',
                'id',
                'name',
                'district',
                'organizationName',
                'regionId',
                'state',
                'createdBy',
                'updatedBy');
        });

        it('Запрос на изменение объекта с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .put(`/xx-api/v1/objects/${objectId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(updatedObject);
            expect(response).to.have.status(401);
        });

        it('Запрос на изменение объекта с невалидными данными в теле запроса, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/objects/${objectId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidObject);
            expect(response).to.have.status(400);
        });

        it('Запрос на изменение несуществующего объекта, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/objects/1488`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validObject);
            expect(response).to.have.status(400);
        });
    });

    describe('Delete object', async () => {
        it('Запрос на удаление объекта с токеном админа, ожидается 200', async () => {
            let response = await request
                .delete(`/xx-api/v1/objects/${objectId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
        });

        it('Запрос на удаление объекта с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .delete(`/xx-api/v1/objects/${objectId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Запрос на удаление несуществующего объекта, ожидается 404', async () => {
            let response = await request
                .delete(`/xx-api/v1/objects/1488`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data).to.equal(null);
        });
    });
});
