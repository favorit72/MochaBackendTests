const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
const assert = require('chai').assert;
chai.use(chaiHttp);

let request;
let server;
let adminToken;
let userId; //для использования в методах получения, редактирования и удаления

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const validUserData = {
    "login": "testLogin3",
    "roleId": 5,
    "organizationName": "Рога и копыта",
    "post": "Тест пост",
    "fullName": "Владислав Владиславович Владиславов",
    "objectIds": [
        5
    ],
    "email": "test3@mail.com",
    "phoneNumber": "88005553527"
};

const updatedUserData = {
    "organizationName": "Копыта и рога",
    "post": "Тест пост 1",
    "fullName": "Игнат Игнатьевич Владиславов",
    "roleId": 5,
    "objectIds": [
        5
    ],
    "email": "test4123123@mail.com",
    "phoneNumber": "88005553523"
};

const deletedUserData = {
    "organizationName": "Копыта и рога",
    "post": "Тест пост 1",
    "fullName": "Игнат Игнатьевич Владиславов",
    "roleId": 5,
    "state": 1,
    "objectIds": [
        5
    ],
    "email": "test4123123@mail.com",
    "phoneNumber": "88005553523"
};

const invalidUserData = {
    "login": "testLogin1",
    "roleId": 5,
    "organizationName": "Рога и копыта",
    "post": "Тест пост",
    "fullName": "Владислав Владиславович Владиславов",
    "objectIds": [
        5
    ],
    "email": "test1Amail.com",
    "phoneNumber": "88005553525"
};

describe('CRUD пользователей', async () => {
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

    describe('Create user', async () => {
        it('Запрос создания пользователя с валидными данными, ожидается 200', async () => {
            let response = await request
                .post(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validUserData);
            userId = response.body.data.id;
            expect(response).to.have.status(200);
            expect(response.body).to.have.all.keys('code', 'data');
            expect(response.body.data).to.have.keys('id',
                'login',
                'fullName',
                'organizationName',
                'email',
                'phoneNumber',
                'blockedUntil',
                'post',
                'role',
                'createdAt',
                'objects',
                'state');
        });

        it('Запрос создания пользователя с невалидными данными, ожидается 400', async () => {
            let response = await request
                .post(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidUserData);
            expect(response).to.have.status(400);
        });

        it('Запрос создания пользователя с некорректным токеном, ожидается 401', async () => {
            let response = await request
                .post(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(validUserData);
            expect(response).to.have.status(401);
        });
    });

    describe('Read user', async () => {
        it('Просмотр списка пользователей, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
        });

        it('Просмотр списка пользователей с невалидным токеном, ожидается 401', async () => {
            let response = await request
                .get(`/xx-api/v1/users`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
            expect(response).to.have.status(401);
        });

        it('Просмотр профиля пользователя, ожидается 200', async () => {
            let response = await request
                .get(`/xx-api/v1/users/${userId}`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body).to.have.all.keys('code', 'data');
            expect(response.body.data).to.have.keys('id',
                'login',
                'fullName',
                'organizationName',
                'email',
                'phoneNumber',
                'blockedUntil',
                'post',
                'role',
                'createdAt',
                'objects',
                'state');
        });

        it('Просмотр профиля несуществующего пользователя, ожидается 404', async () => {
            let response = await request
                .get(`/xx-api/v1/users/1488`)
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(404);
        });
    });

    describe('Update user', async () => {
        it('Обновление пользователя, ожидается 200', async () => {
            let response = await request
                .put(`/xx-api/v1/users/${userId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(updatedUserData);
            expect(response).to.have.status(200);
        });

        it('Обновление c невалидным токеном, ожидается 401', async () => {
            let response = await request
                .put(`/xx-api/v1/users/${userId}`)
                .set({"Authorization-Header-Custom": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsInJvbGUiOjEsImxvZ2luIjoiOGY3MDBlZTE1NzYwODk1NWJjNTRkMTRiMjJhNzBjY2VjZWNmOTQ2NDFhYjBmMzM2YTc1ZDIwMmI0MzY4ZDJjZCIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE1NzU4MDAzMTcsImV4cCI6MTU3NTg4NjcxN30.oHqJWIfLKLecGzHbJVQMuzqxE_tgzN78Rybx7bqkRFM"})
                .send(updatedUserData);
            expect(response).to.have.status(401);
        });

        it('Обновление несуществующего пользователя, ожидается 404', async () => {
            let response = await request
                .put(`/xx-api/v1/users/1234`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validUserData);
            expect(response).to.have.status(404);
        });

        it('Обновление пользователя без указания id, ожидается 404', async () => {
            let response = await request
                .put(`/xx-api/v1/users/`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(validUserData);
            expect(response).to.have.status(404);
        });

        it('Обновление пользователя с невалидными данными в теле запроса, ожидается 400', async () => {
            let response = await request
                .put(`/xx-api/v1/users/${userId}`)
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidUserData);
            expect(response).to.have.status(400);
        });
    });
});

