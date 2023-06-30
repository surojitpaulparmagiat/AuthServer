A basic (not yet done) implementation of OAuth 2.0 for Aninvoice. For now it only works ith client type "web"
and grant_type "code".

- Create an App
- Request for a grant type with client id, get a code back.
- Using that code and client credential, request for a short life access token and a long live refresh token, that can be used to access protected resources from Aninvoice server.