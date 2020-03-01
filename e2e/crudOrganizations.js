const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let organizationId;

//функция для создания уникального ИНН
function random() {
    return Math.floor(Math.random() * Math.floor(1000));
}

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validOrganization = {
    "name": "Roga Losya",
    "inn": "123123123123-12312312 " + random(),
    "comment": "Тест информация по организации",
    "regionIds": [
        3
    ]
};

const updatedOrganization = {
    "name": "Roga Olenya",
    "inn": "123123",
    "comment": "Измененная информация по организации",
    "regionIds": [4],
    "state": 0
};

const invalidOrganization = {
    "name": "Roga Losya",
    "inn": "123123123123-12312312  ооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооооочень длинный текст для теста ",
    "comment": "Тест информация по организации",
    "regionIds": [1488]
};

const deletedOrganization = {
    "name": "Roga Olenya",
    "inn": "123123",
    "comment": "Измененная информация по организации",
    "regionIds": [4],
    "state": 1
};

describe('CRUD организаций', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();

        let response = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(correctCredentials);
        adminToken = response.body.data.user.accessToken;
    });

    after(() => {
        request.close();
    });

    describe('Create organizations', async () => {
        it('Создание организации, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/organizations`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validOrganization);
            organizationId = response.body.data.id;
            expect(response).to.have.status(200);
            expect(response.body.data).have.all.keys(
                'id',
                'name',
                'inn',
                'comment',
                'state',
                'createdBy',
                'createdAt',
                'updatedBy',
                'updatedAt');
        });

        it('Создание организации с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/organizations`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(validOrganization);
            expect(response).to.have.status(401);
        });

        it('Создание организации с невалидными данными, ожидается 400', async () => {
            let response = await request
                .post(`/xx-api/v1/organizations`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidOrganization);
            expect(response).to.have.status(400);
        });
    });

    describe('Read organizations', async () => {
        it('Получение списка организаций, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/organizations`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
        });

        it('Получение организации по id, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%20${organizationId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
        });

        it('Получение оборудования с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%20${organizationId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Получение несуществующего оборудования, ожидается пустой массив items', async () => {
            let response = await request
                .get(`/xx-api/v1/equipments?filter=id%20eq%20322`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data.items.length).to.equal(0);
        });
    });

    describe('Update organizations', async () => {
        it('Обновление организации, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/organizations/${organizationId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedOrganization);
            expect(response).to.have.status(200);
            expect(response.body.data.id).to.equal(organizationId);
            expect(response.body.data.name).to.equal(updatedOrganization.name);
            expect(response.body.data.comment).to.equal(updatedOrganization.comment);
            expect(response.body.data.inn).to.equal(updatedOrganization.inn);
            expect(response.body.data.regions[0].id).to.equal(updatedOrganization.regionIds[0]);
            expect(response.body.data).have.all.keys(
                'id',
                'name',
                'inn',
                'comment',
                'state',
                'regions',
                'createdBy',
                'createdAt',
                'updatedBy',
                'updatedAt');
        });

        it('Обновление организации с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .put(`/xx-api/v1/organizations/${organizationId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(updatedOrganization);
            expect(response).to.have.status(401);
        });

        it('Обновление несуществующей организации, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/organizations/1488`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedOrganization);
            expect(response).to.have.status(400);
        });

        it('Пометка организации как удаленной, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/organizations/${organizationId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(deletedOrganization);
            expect(response).to.have.status(200);
        });

        it('Проверка удаления организации, ожидается 404', async () => {
            let response = await request
                .get(`/xx-api/v1/organizations/${organizationId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(404);
        });
    });
});
