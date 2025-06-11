### PNChat Project - Rico Hayden
### Built With

* [![.Net][DotNet-fr]][DotNet-url]  [![C#][CSharp-dotnet]][CSharp-url]  [![Angular][Angular.io]][Angular-url]  [![TypeScript][TypeScript-ng]][TypeScript-url]  [![MicrosoftSQLServer][MSSQL-db]][MSSQL-url]  [![NPM][NPM-pmv]][NPM-url]

<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->

[DotNet-fr]: https://img.shields.io/badge/.NET-5C2D91?style=for-the-badge&logo=.net&logoColor=white
[DotNet-url]: https://learn.microsoft.com/en-us/dotnet/
[CSharp-dotnet]: https://img.shields.io/badge/c%23-%23239120.svg?style=for-the-badge&logo=c-sharp&logoColor=white
[CSharp-url]: https://learn.microsoft.com/en-us/dotnet/csharp/
[Angular.io]: https://img.shields.io/badge/Angular-DD0031?style=for-the-badge&logo=angular&logoColor=white
[Angular-url]: https://angular.io/
[TypeScript-ng]: https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white
[TypeScript-url]: https://www.typescriptlang.org/
[MSSQL-db]: https://img.shields.io/badge/Microsoft%20SQL%20Server-CC2927?style=for-the-badge&logo=microsoft%20sql%20server&logoColor=white
[MSSQL-url]: https://learn.microsoft.com/en-us/sql/sql-server/?view=sql-server-ver16
[NPM-pmv]: https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&logo=npm&logoColor=white
[NPM-url]: https://www.npmjs.com/

# Angular Github Actions

**1.** Let's create the application with the Angular base structure using the `@angular/cli` with the route file and the SCSS style format.

```shell
ng new pn-chat-client
? Would you like to add Angular routing? Yes
? Which stylesheet format would you like to use? CSS
/*
.....
*/
✔ Packages installed successfully.
    Successfully initialized git.
```

**2.** Change the `package.json` file and add the scripts below. Replace the `Gerbil1987` value with your GitHub username.

```json
  "build:prod": "ng build --configuration production --source-map",
  "test:headless": "ng test --watch=false --browsers=ChromeHeadless"
```

**3.** Run the test with the command below.

```shell
npm run test:headless

> angular-github-actions@1.0.0 test:headless
> ng test --watch=false --browsers=ChromeHeadless
```

**4.** Run the application with the command below. Access the URL `http://localhost:4200/` and check if the application is working.

```shell
npm start

> angular-github-actions@1.0.0 start
> ng serve
/*
....
*/
✔ Browser application bundle generation complete.
✔ Compiled successfully.
```

**5.** Build the application with the command below.

```shell
npm run build:prod

> angular-github-actions@1.0.0 build:prod
> ng build --configuration production --source-map

✔ Browser application bundle generation complete.
✔ Copying assets complete.
✔ Index html generation complete.

/*
.........
.........
*/

Build at: 2021-09-23T01:22:35.870Z - Hash: 3a09fd924c26cb02fafc - Time: 13654ms
```

**6.** Let's create and configure the file with the GitHub Actions flow. Create the `.github/workflows/gh-pages.yml` file.

```shell
mkdir -p .github/workflows
touch .github/workflows/gh-pages.yml
```

**7.** Configure the `.github/workflows/gh-pages.yml` file with the content below.

```yaml
name: GitHub Pages

on:
  push:
    branches:
    - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    - name: Checkout
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Run tests
      run: npm run test:headless

    - name: Build
      run: npm run build:prod

    - name: Deploy
      if: success()
      uses: peaceiris/actions-gh-pages@v3
      with:
        github_token: ${{ secrets.GITHUB_TOKEN }}
        publish_dir: dist/pn-chat-client
        enable_jekyll: true
```

## Cloning the application

**1.** Clone the repository.

```shell
git clone https://github.com/Gerbil1987/PN-Chat.git
```

**2.** Install the dependencies.

```shell
npm ci
```

**3.** Run the application.

```shell
npm start
```

