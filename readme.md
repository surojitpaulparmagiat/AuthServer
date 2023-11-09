A basic (not yet done) implementation of OAuth 2.0 for Aninvoice. For now it only works ith client type "web"
and grant_type "code".

- Create an App
- Request for a grant type with client id, get a code back.
- Using that code and client credential, request for a short life access token and a long live refresh token, that can be used to access protected resources from Aninvoice server.

[![Run in Postman](https://run.pstmn.io/button.svg)](https://app.getpostman.com/run-collection/17292455-3d3a23fe-8e8f-45f2-96cd-e2ee91cef0cb?action=collection%2Ffork&source=rip_markdown&collection-url=entityId%3D17292455-3d3a23fe-8e8f-45f2-96cd-e2ee91cef0cb%26entityType%3Dcollection%26workspaceId%3Dc70ee961-78c6-4d89-9783-a3ff3517312d)
