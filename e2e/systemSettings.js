const chai = require('chai');
const expect = chai.expect;
const app = require('../src');
const chaiHttp = require('chai-http');
chai.use(chaiHttp);

let server;
let request;
let adminToken;
let analystToken;
let seniorToken;
let headToken;

const correctCredentials = {
    "login": "default_admin",
    "password": "135xx642"
};

const loginAnalystData = {
    "login": "analystUser",
    "password": "123"
};

const loginSeniorData = {
    "login": "seniorUser",
    "password": "123"
};

const loginHeadData = {
    "login": "headUser",
    "password": "123"
};

const changeSettings = {
    "userBlockingPeriod": 172800000,
    "idlePeriod": 1260000,
    "backupInterval": 345600000,
    "backupCount": 3
};

const invalidSettings = {
    "userBlockingPeriod": "",
    "idlePeriod": "",
    "backupInterval": "",
    "backupCount": 3
};

const createAnalystUserData = {
    "login": "analystUser",
    "roleId": 6,
    "organizationName": "Рога и копыта",
    "post": "Аналитик всея руси",
    "fullName": "Иванов Иван Иваныч",
    "objectIds": [
        5
    ],
    "email": "analyst@mail.com",
    "phoneNumber": "89606456230"
};

const createSeniorUserData = {
    "login": "seniorUser",
    "roleId": 8,
    "organizationName": "Рога и копыта",
    "post": "старший всея руси",
    "fullName": "Иванов Иван Иваныч",
    "objectIds": [
        2
    ]
};

const createHeadUserData = {
    "login": "headUser",
    "roleId": 7,
    "organizationName": "Рога и копыта",
    "post": "руководитель всея руси",
    "fullName": "Иванов Иван Иваныч",
    "objectIds": [
        2
    ]
};

describe('Тесты настроек системы', async () => {
    before(async () => {
        server = await app.init;
        request = chai.request(server).keepOpen();

        let response = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(correctCredentials);
        adminToken = response.body.data.user.accessToken;

        await request
            .post(`/xx-api/v1/users`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(createAnalystUserData);

        await request
            .post(`/xx-api/v1/users`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(createHeadUserData);

        await request
            .post(`/xx-api/v1/users`)
            .set({"Authorization-Header-Custom": adminToken})
            .send(createSeniorUserData);

        let response1 = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(loginAnalystData);
        analystToken = response1.body.data.user.accessToken;

        let response2 = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(loginSeniorData);
        seniorToken = response2.body.data.user.accessToken;

        let response3 = await request
            .post(`/xx-api/v1/auth/admin/sign-in`)
            .send(loginHeadData);
        headToken = response3.body.data.user.accessToken;
    });

    after(() => {
        request.close()
    });

    describe('Чтение настроек системы', async () => {
        it('Запрашиваем настройки, ожидается 200 ', async () => {
            let response = await request
                .get('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": adminToken});
            expect(response).to.have.status(200);
            expect(response.body.data).have.all.keys(
                'userBlockingPeriod',
                'idlePeriod',
                'backupInterval',
                'backupCount'
            )
        });
    });

    describe('Изменение настроек системы', async () => {
        it('Корректно меняем настройки, ожидаем 200', async () => {
            let response = await request
                .put('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": adminToken})
                .send(changeSettings);
            expect(response).to.have.status(200);
            expect(response.body.data.userBlockingPeriod).to.equal(changeSettings.userBlockingPeriod);
            expect(response.body.data.idlePeriod).to.equal(changeSettings.idlePeriod);
            expect(response.body.data.backupInterval).to.equal(changeSettings.backupInterval);
            expect(response.body.data.backupCount).to.equal(changeSettings.backupCount);
        });

        it('Меняем настройки на пустые поля, ожидаем 400', async () => {
            let response = await request
                .put('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": adminToken})
                .send(invalidSettings);
            expect(response).to.have.status(400)
        });
    });

    describe('Чтение настроек с разными правами', async () => {
        it('Запрашиваем настройки с токеном аналитика, ожидаем 200', async () => {
            let response = await request
                .get('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": analystToken});
            expect(response).to.have.status(200);
        });

        it('Запрашиваем настройки с токеном старшего, ожидаем 200', async () => {
            let response = await request
                .get('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": seniorToken});
            expect(response).to.have.status(200);
            !expect(response.body.data).to.have.all.keys(
                'idlePeriod'
            )
        });

        it('Запрашиваем настройки с токеном руководителя, ожидаем 200', async () => {
            let response = await request
                .get('/xx-api/v1/settings')
                .set({"Authorization-Header-Custom": headToken});
            expect(response).to.have.status(200);
        })
    })
});
