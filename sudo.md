# How it'll work

-   First the user will go to index.html
-   It'll check if the iser is logged in
-   If logged in:

    -   send `hash` from cookies with request to api/guilds
    -   Match guilds

-   If not logged in:
    -   send to /login
    -   Log in
