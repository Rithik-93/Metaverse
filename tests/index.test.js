const axios2 = require('axios');

const axios = {
    post: async (...args) => {
        try {
            const res = await axios2.post(...args)
            return res
        } catch (e) {
            return e.response
        }
    },
    get: async (...args) => {
        try {
            const res = await axios2.get(...args)
            return res
        } catch (e) {
            return e.response
        }
    },
    put: async (...args) => {
        try {
            const res = await axios2.put(...args)
            return res
        } catch (e) {
            return e.response
        }
    },
    delete: async (...args) => {
        try {
            const res = await axios2.delete(...args)
            return res
        } catch (e) {
            return e.response
        }
    }
}

describe("Authentication", () => {
    test('User is able to sign up only once', async () => {
        let username = "rithik" + Math.random()
        let password = "dadasdasd"
        const response = await axios.post(`${BACKEND}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        expect(response.status).toBe(200);
        const updatedResponse = await axios.post(`${BACKEND}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });
        expect(updatedResponse.status).toBe(400);
    })

    test("Signup request fails if the username is empty", async () => {
        let password = "dadasdasd"
        const response = await axios.post(`${BACKEND}/api/v1/signup`, {
            password,
            type: "admin"
        })
        expect(response.status).toBe(400)
    })

    test("Signin succeeds if the username and password are correct", async () => {
        let username = `rithik${Math.random()}`
        let password = "asdasdasd"
        let response = await axios.post(`${BACKEND}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });
        let response2 = await axios.post(`${BACKEND}/api/v1/signup`, {
            username,
            password,
        });
        expect(response.status).toBe(200)
        expect(response2.data.token).toBeDefined();
    })

    test('Signin fails if the username and password are incorrect', async () => {
        const username = `rithik${Math.random()}`
        const password = "asdasdasd"

        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            role: "admin"
        });

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: "asdasdasd",
            password
        })

        expect(response.status).toBe(403)
    })
})

describe("user metadata", () => {
    let token;
    let avatarId;
    beforeAll(async () => {
        let username = "rithik" + Math.random();
        let password = "asdasdadsa";
        await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        })
        let response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })
        // expect(response.data.token).toBeDefined();
        token = response.data.token;

        let response2 = await axios.post(`${BACKEND}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            Headers: {
                authorization: `Bearer ${token}`
            }
        })

        console.log(`avatarResponse is`, response2.data.avatarId);

        avatarId = response2.data.avatarId

    })

    test("User can't update their metadata without valid avatarId", async () => {
        let response = axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId: "asdasdasd"
        }, {
            Headers: {
                authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User can update their metadata with right avatarId", async () => {
        let response = axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        }, {
            Headers: {
                authorization: `Bearer ${token}`
            }
        })

        expect(response.status).toBe(200)
    })
    test("User is not able to update their metadata if the auth header is not present", async () => {
        let response = axios.post(`${BACKEND_URL}/api/v1/user/metadata`, {
            avatarId
        })

        expect(response.status).toBe(403)
    })
})

describe("User avatar information", () => {
    let avatarId;
    let userId;
    let token;

    beforeAll(async () => {
        const username = `kirat-${Math.random()}`
        const password = "123456"

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        userId = signupResponse.data.userId

        console.log("userid is " + userId)
        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        token = response.data.token

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                authorization: `Bearer ${token}`
            }
        })

        avatarId = avatarResponse.data.avatarId;

    })

    test("Get back avatar information for a user", async () => {
        let response = axios.post(`${BACKEND_URL}/api/v1/user/metadata/bulk?id=[${userId}]`)
        expect(response.data.avatar.length).toBe(1)
        expect(response.data.avatar[0].userId).toBe(userId);
    })

    test("Available avatars lists the recently created avatar", async () => {
        const response = axios.post(`${BACKEND_URL}/api/v1/avatars`);
        expect(response.data.avatars.length).not.toBe(0);
        const myAvatar = response.data.avatars.find(x => x.id == avatarId);
        expect(myAvatar).toBeDefined()
    })
})

describe("Space", () => {

    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `rithik${Math.random()}`
        const password = "asdasd"

        const signupres = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        adminId = signupres.data.userId

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignupResponse.data.userId

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })

        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id
        console.log(element2Id)
        console.log(element1Id)
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                elementId: element1Id,
                x: 20,
                y: 20
            }, {
                elementId: element1Id,
                x: 18,
                y: 20
            }, {
                elementId: element2Id,
                x: 19,
                y: 20
            }
            ]
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        console.log("mapResponse.status")
        console.log(mapResponse.data.id)

        mapId = mapResponse.data.id

    });

    test("User is able to create a spac", async () => {
        let response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd",
            "dimensions": "100x150",
            "mapId": mapId
        }, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200)
        expect(response.data.spaceId).toBeDefined();
    })

    test("User is able to create a space without sending mapId ie empty space", async () => {
        let response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd",
            "dimensions": "100x150"
        }, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(200)
        expect(response.data.spaceId).toBeDefined();
    })

    test("User is able to create a space without sending mapId and dimensions", async () => {
        let response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd"
        }, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User is not able t delete space that's not there", async () => {
        let response = await axios.delete(`${BACKEND_URL}/api/v1/space/asdasd`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("User is able to delete space", async () => {
        let response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd",
            "dimensions": "100x150"
        }, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        let response2 = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response2.status).toBe(200);
    })

    test("User should not be able to delete a space created by another user", async () => {
        const response = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "Test",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const deleteReponse = await axios.delete(`${BACKEND_URL}/api/v1/space/${response.data.spaceId}`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        expect(deleteReponse.status).toBe(403)
    })

    test("Admin has no spaces initially", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        expect(response.data.spaces.length).toBe(0)
    })

    test("Admin has gets once space after", async () => {
        const createSpace = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdads",
            "dimensions": "100x200",
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/all`, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const filteredSpace = response.data.spaces.find(x => x.id == createSpace.data.spaceId)
        expect(response.data.spaces.length).toBe(1)
        expect(filteredSpace).toBeDefined()

    })
})

describe("Arena", () => {

    let mapId;
    let element1Id;
    let element2Id;
    let adminToken;
    let adminId;
    let userToken;
    let userId;
    let spaceId;


    beforeAll(async () => {
        const username = `rithik${Math.random()}`
        const password = "asdasd"

        const signupres = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        adminId = signupres.data.userId

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignupResponse.data.userId

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })

        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        element1Id = element1Response.data.id
        element2Id = element2Response.data.id
        console.log(element2Id)
        console.log(element1Id)
        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                elementId: element1Id,
                x: 20,
                y: 20
            }, {
                elementId: element1Id,
                x: 18,
                y: 20
            }, {
                elementId: element2Id,
                x: 19,
                y: 20
            }
            ]
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        console.log("mapResponse.status")
        console.log(mapResponse.data.id)

        mapId = mapResponse.data.id

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd",
            "dimensions": "100x200",
            "mapId": mapId
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })
        spaceId = spaceResponse.data.spaceId

    });

    test("Incorrect spaceId returns a 400", async () => {

        let response = await axios.get(`${BACKEND_URL}/api/v1/space/asdasd`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.status).toBe(400)
    })

    test("Correct spaceId returns all the elements", async () => {

        let response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(response.data.dimensions).toBe("100x200")
        expect(response.data.dimensions.length).toBe(3)
    })

    test("Delete endpoint is able to delete an element", async () => {
        const response = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        await axios.delete(`${BACKEND_URL}/api/v1/space/element`, {
            data: {
                id: response.data.elements[0].id
            },
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const finalResponse = await axios.get(`${BACKEND_URL}/api/v1/space/${spaceId}`, {
            Headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        expect(finalResponse.data.elements.length).toBe(2)
    })
})

describe("Admin router", () => {
    let adminToken;
    let adminId;
    let userToken;
    let userId;

    beforeAll(async () => {
        const username = `rithik${Math.random()}`
        const password = "asdasd"

        const signupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        adminId = signupResponse.data.userId

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username,
            password
        })

        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "USER",
            password,
            type: "user"
        });

        userId = userSignupResponse.data.userId

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "USER",
            password
        })

        userToken = userSigninResponse.data.token

    });

    test("User is not able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "ASD space",
            "defaultElements": []
        }, {
            headers: {
                authorization: `Bearer ${userToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/123`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })

        expect(elementReponse.status).toBe(403)
        expect(mapResponse.status).toBe(403)
        expect(avatarResponse.status).toBe(403)
        expect(updateElementResponse.status).toBe(403)
    })

    test("Admin is able to hit admin Endpoints", async () => {
        const elementReponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "name": "Space",
            "dimensions": "100x200",
            "defaultElements": []
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        const avatarResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/avatar`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
            "name": "Timmy"
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })
        expect(elementReponse.status).toBe(200)
        expect(mapResponse.status).toBe(200)
        expect(avatarResponse.status).toBe(200)
    })

    test("Admin is able to update the imageUrl for an element", async () => {
        const elementResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const updateElementResponse = await axios.put(`${BACKEND_URL}/api/v1/admin/element/${elementResponse.data.id}`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQm3RFDZM21teuCMFYx_AROjt-AzUwDBROFww&s",
        }, {
            headers: {
                "authorization": `Bearer ${adminToken}`
            }
        })

        expect(updateElementResponse.status).toBe(200);

    })


});

describe('WS tests', () => {
    let adminToken;
    let adminUserId;
    let userToken;
    let adminId;
    let userId;
    let mapId;
    let element1Id;
    let element2Id;
    let spaceId;
    let ws1;
    let ws2;
    let ws1Messages = []
    let ws2Messages = []
    let userX;
    let userY;
    let adminX;
    let adminY;

    async function setUpHTTP() {
        const username = `rithik${Math.random()}`
        const password = "asdasd"

        const signupres = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username,
            password,
            type: "admin"
        });

        adminId = signupres.data.userId

        const response = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username,
            password
        })

        adminToken = response.data.token

        const userSignupResponse = await axios.post(`${BACKEND_URL}/api/v1/signup`, {
            username: username + "-user",
            password,
            type: "user"
        });

        userId = userSignupResponse.data.userId

        const userSigninResponse = await axios.post(`${BACKEND_URL}/api/v1/signin`, {
            username: username + "-user",
            password
        })

        userToken = userSigninResponse.data.token

        const element1Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        });

        const element2Response = await axios.post(`${BACKEND_URL}/api/v1/admin/element`, {
            "imageUrl": "https://encrypted-tbn0.gstatic.com/shopping?q=tbn:ANd9GcRCRca3wAR4zjPPTzeIY9rSwbbqB6bB2hVkoTXN4eerXOIkJTG1GpZ9ZqSGYafQPToWy_JTcmV5RHXsAsWQC3tKnMlH_CsibsSZ5oJtbakq&usqp=CAE",
            "width": 1,
            "height": 1,
            "static": true
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })

        element1Id = element1Response.data.id
        element2Id = element2Response.data.id

        const mapResponse = await axios.post(`${BACKEND_URL}/api/v1/admin/map`, {
            "thumbnail": "https://thumbnail.com/a.png",
            "dimensions": "100x200",
            "name": "Test space",
            "defaultElements": [{
                elementId: element1Id,
                x: 20,
                y: 20
            }, {
                elementId: element1Id,
                x: 18,
                y: 20
            }, {
                elementId: element2Id,
                x: 19,
                y: 20
            }
            ]
        }, {
            headers: {
                authorization: `Bearer ${adminToken}`
            }
        })
        console.log("mapResponse.status")
        console.log(mapResponse.data.id)

        mapId = mapResponse.data.id

        const spaceResponse = await axios.post(`${BACKEND_URL}/api/v1/space`, {
            "name": "asdasd",
            "dimensions": "100x200",
            "mapId": mapId
        }, {
            headers: {
                "authorization": `Bearer ${userToken}`
            }
        })
        spaceId = spaceResponse.data.spaceId
    }

    async function setUpWS() {
        ws1 = new WebSocket(WS_URL);

        ws1.onmessage((event) => {
            ws1Messages.push(JSON.parse(event.data))
        })

        await new Promise(r => {
            ws1.onopen = r
        })

        ws2 = new WebSocket(WS_URL);

        ws2.onmessage((event) => {
            ws2Messages.push(JSON.parse(event.data))
        });

        await new Promise(r => {
            ws2.onopen = r
        })

    }

    function waitForAndPopLatestMessage(messagesArray) {
        return new Promise(resolve => {
            if (messagesArray > 0) {
                resolve(messagesArray.shift())
            }
            let interval = setInterval(() => {
                if (messagesArray > 0) {
                    resolve(messagesArray.shift())
                    clearInterval(interval)
                }
            }, 100)
        })

    }

    beforeAll(async () => {
        await setUpHTTP()
        await setUpWS()
    })

    test("Get back ack for joining the space", async () => {

        ws1.send(JSON.stringify({
            "type": "join",
            "payload": {
                "spaceId": spaceId,
                "token": adminToken
            }
        }))

        const message1 = await waitForAndPopLatestMessage(ws1Messages);

        ws2.send(JSON.stringify({
            "type": "join",
            "payload": {
                "spaceId": spaceId,
                "token": userToken
            }
        }))
        console.log("insixce first test3")

        const message2 = await waitForAndPopLatestMessage(ws2Messages);
        const message3 = await waitForAndPopLatestMessage(ws1Messages);

        expect(message1.type).toBe("space-joined")
        expect(message2.type).toBe("space-joined")
        expect(message1.payload.users.length).toBe(0)
        expect(message2.payload.users.length).toBe(1)
        expect(message3.type).toBe("user-joined");
        expect(message3.payload.x).toBe(message2.payload.spawn.x);
        expect(message3.payload.y).toBe(message2.payload.spawn.y);
        expect(message3.payload.userId).toBe(userId);

        adminX = message1.payload.spawn.x
        adminY = message1.payload.spawn.y

        userX = message2.payload.spawn.x
        userY = message2.payload.spawn.y
    })

    test("User should not be able to move across the boundary of the wall", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: 1000000,
                y: 1000000
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected")
        expect(message.payload.x).toBe(adminX)
        expect(message.payload.y).toBe(adminY)
    })

    test("User should not be able to move two blocks at the same time", async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX + 2,
                y: adminY
            }
        }));

        const message = await waitForAndPopLatestMessage(ws1Messages);
        expect(message.type).toBe("movement-rejected")
        expect(message.payload.x).toBe(adminX)
        expect(message.payload.y).toBe(adminY)
    })

    test("Correct movement should be broadcasted to the other sockets in the room",async () => {
        ws1.send(JSON.stringify({
            type: "move",
            payload: {
                x: adminX + 1,
                y: adminY,
                userId: adminId
            }
        }));

        const message = await waitForAndPopLatestMessage(ws2Messages);
        expect(message.type).toBe("movement")
        expect(message.payload.x).toBe(adminX + 1)
        expect(message.payload.y).toBe(adminY)
    })

    test("If a user leaves, the other user receives a leave event", async () => {
        ws1.close()
        const message = await waitForAndPopLatestMessage(ws2Messages);
        expect(message.type).toBe("user-left")
        expect(message.payload.userId).toBe(adminUserId)
    })
})
