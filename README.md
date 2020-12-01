# How to use AppSync GraphQL TypeScript types in React

The article to go with this code is on [Dev.to](https://dev.to/applification/how-to-use-amplify-appsync-graphql-types-in-a-react-typescript-app-of).

----

## Init NextJS TypeScript App

First off I started out with a fresh NextJS project, nothing special, just an out of the box app configured with TypeScript following the NextJS docs.

- https://nextjs.org/docs/getting-started#setup
- https://nextjs.org/docs/basic-features/typescript

```bash
npx create-next-app
touch tsconfig.json
npm install --save-dev typescript @types/react @types/node
npm run dev
```

In short we now have a NextJS app in TypeScript, we just need to start renaming `.js` files to `.tsx`

## Init Amplify

If you haven't used Amplify before there are some prerequisites you may need to install and configure. See https://docs.amplify.aws/start/getting-started/installation/q/integration/react. These instructions follow on assuming you have already done these steps.

Initialise a new Amplify backend with:

`amplify init`

I changed a few options specifically for NextJS:

```bash
? Enter a name for the project nexttsappsync
? Enter a name for the environment dev
? Choose your default editor: Visual Studio Code
? Choose the type of app that you are building javascript
Please tell us about your project
? What javascript framework are you using react
? Source Directory Path:  ./
? Distribution Directory Path: out
? Build Command:  npm run-script build
? Start Command: npm run-script start
```

## GraphQL Folder

Next add an API to Amplify:

`amplify add api`

Choose `GraphQL` as it's strongly typed which is ideal for our TypeScript frontend. Use the Todo generated single object with fields schema:

```bash
? Please select from one of the below mentioned services: GraphQL
? Provide API name: todoapi
? Choose the default authorization type for the API API key
? Enter a description for the API key: todoAPIKey
? After how many days from now the API key should expire (1-365): 365
? Do you want to configure advanced settings for the GraphQL API No, I am done.
? Do you have an annotated GraphQL schema? No
? Choose a schema template: Single object with fields (e.g., “Todo” with ID, name, description)
```

The generated `schema.graphql` has a Todo model as follows:

```ts
type Todo @model {
  id: ID!
  name: String!
  description: String
}
```

Next configure amplify codegen and generate the TypeScript types based off our GraphQL Schema.

`amplify configure codegen`

In the generation target language ensure you choose `typescript`. For the filepath I set `graphql/**/*.ts` because NextJS doesn't use a `src` folder and I wanted everything generated inside a `graphql` folder but you can generate to whatever filepath you like.

Enter the file name and path for the generated code I used `graphql/API.ts`
 
 ```bash
? Enter a file name pattern of graphql queries, mutations and subscriptions graphql/**/*.ts
? Do you want to generate/update all possible GraphQL operations - queries, mutations and subscriptions Yes
? Enter maximum statement depth [increase from default if your schema is deeply nested] 2
? Enter the file name for the generated code graphql/API.ts
? Do you want to generate code for your newly created GraphQL API Yes
```

## GraphiQL

We now have a GraphQL API, create some Todo items for the frontend to play with by running `amplify mock`. Mocking will create the underlying DynamoDB tables and spin up GraphiQL on a local url. You should see something like:

`AppSync Mock endpoint is running at http://192.168.86.161:20002`

Open that link and you'll see GraphiQL. Create some data using a mutation as follows:

```ts
mutation MyMutation {
  createTodo(input: {name: "Put out the bins", description: "You know what to do again"}) {
    id
  }
}
```

Create a few more with your own todo name and description then use the following query to see your data:

```ts
query MyQuery {
  listTodos {
    items {
      id
      description
      createdAt
      name
      updatedAt
    }
  }
}
```

In my case that yields:

```json
{
  "data": {
    "listTodos": {
      "items": [
        {
          "id": "39e9cb83-d936-4b05-999d-61f412d57ecb",
          "description": "You know what to do again",
          "createdAt": "2020-11-25T10:21:39.407Z",
          "name": "Put out the bins",
          "updatedAt": "2020-11-25T10:21:39.407Z"
        },
        {
          "id": "dd2d975b-be52-4a23-8dfd-03e6a4a256ae",
          "description": "The best chore!",
          "createdAt": "2020-11-25T10:22:20.674Z",
          "name": "Hoover up lounge",
          "updatedAt": "2020-11-25T10:22:20.674Z"
        },
        {
          "id": "8bce419d-39d5-425b-ab45-00f731e0454e",
          "description": "You know what to do",
          "createdAt": "2020-11-25T10:21:31.577Z",
          "name": "Put out the recycling",
          "updatedAt": "2020-11-25T10:21:31.577Z"
        }
      ]
    }
  }
}
```

Note the structure of the returned JSON. There is a data object, which has a `listTodos` object, which contains an `items` array. Each array item has properties that are defined by our strongly typed `schema.graphql` file. You'll also notice some utility properties have been added automatically by Amplify, specifically `createdAt` and `updatedAt`

## React

Moving to the frontend lets get Amplify set up with our React App. First we need to install Amplify and the Amplify GraphQL library.

`npm i aws-amplify @aws-amplify/api-graphql`

Rename `pages/index.js` to `pages/index.tsx` then add:

```ts
import Amplify from "aws-amplify";
import awsExports from "../aws-exports";
Amplify.configure(awsExports);
```

Run `npm run dev` and it should show the out of the box NextJS app running on `http://localhost:3000`. The only difference being we've connected Amplify to it.

## GraphQL Integration

Take a look in the `graphql` folder, note the `queries.ts`, `mutations.ts`, `subscriptions.ts` files and the `API.ts` file from the codegen command. Lets make our imports easier by creating the file `/graphql/index.tsx` and adding the following:

```ts
export * from './API';
export * from './mutations';
export * from './queries';
export * from './subscriptions';
```

We can now import our types and queries from the same place. Back in the `pages/index.tsx` file import the following:

```ts
import * as React from 'react';
import GraphQLAPI, { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql';
import { listTodos } from '../graphql'
```

Then add some code to fetch our todos using the generated `listTodos` query and specifying the API_KEY as the authorization mode for our GraphQL:

```ts
  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await GraphQLAPI.graphql({
          query: listTodos,
          authMode: GRAPHQL_AUTH_MODE.API_KEY
        })
        console.log(response);
      } catch (error) {
        console.log(error);
      }
    };
  
    fetchTodos();
  }, []);
```

If all went well you should see the exact same JSON response we saw in GraphiQL logged in the console. To get that displayed on the page we'll make use of React.useState() changing the code to:

```ts
  const [todos, setTodos] = React.useState(undefined);

  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = await GraphQLAPI.graphql({
          query: listTodos,
          authMode: GRAPHQL_AUTH_MODE.API_KEY
        })
        console.log(response);
        setTodos(response.data);
      } catch (error) {
        console.log(error);
      }
    };
  
    fetchTodos();
  }, []);
```

We've now got the list of todos in state, we just need to map over the array in JSX. Remove the four anchor tag sections and replace with the following code which will map over the todo array and display all our todos on the page.

```html
  <div className={styles.grid}>
    {todos?.listTodos?.items.map((todo) => {
      return (
        <a href="#" className={styles.card}>
          <h3>{todo.name}</h3>
          <p>{todo.description}</p>
        </a>
      )
    })}
  </div>
```

You should see the todo items you added in GraphiQL on the web page. This is good but it's all still JavaScript, we still need to add some TypeScript to make use of the GraphQL types. 

We can modify the GraphQLAPI code to use the generated `ListTodosQuery` type from `API.ts`. First import it:

`import { listTodos, ListTodosQuery } from '../graphql'`

Then tell GraphQL to use this type:

```ts
  const response = (await GraphQLAPI.graphql({
    query: listTodos,
    authMode: GRAPHQL_AUTH_MODE.API_KEY
  })) as { data: ListTodosQuery }
```

Note how we need to account for the fact the response returned is a data object. If you look in the `API.ts` file you'll see that the type doesn't contain a data object so we need to let TypeScript know that we expect it.

```ts
export type ListTodosQuery = {
  listTodos:  {
    __typename: "ModelTodoConnection",
    items:  Array< {
      __typename: "Todo",
      id: string,
      name: string,
      description: string | null,
      createdAt: string,
      updatedAt: string,
    } | null > | null,
    nextToken: string | null,
  } | null,
};
```

If you try typing a period `.` after response in the console.log you'll see we now have full intellisense! TypeScript is telling you it expects the response to have a `data` object. If you select that then type another period TypeScript tells you it expects a `listTodos` object.

TypeScript now knows exactly what format our GraphQL API responses should be. However, down in the JSX code we've some more work to do. At the moment our API response is TypeScript aware but the JSX isn't, when mapping over the todos TypeScript can't infer what the types should be.

We can fix that by telling React.useState what types to expect:

```ts
const [todos, setTodos] = React.useState<ListTodosQuery | undefined>(undefined);
```

Here we've told TypeScript the same as the API to expect `ListTodosQuery` as the type but also that it could be undefined if we don't yet have any data.

Now if you go to the JSX and start typing you'll see all the same lovely intellisense!

e.g. `{todo.name}`

This is great but if you take a closer look at the intellisense in VSCode you'll see some `__typename` entries. Looking back at the `ListTodosQuery` you note how that is indeed part of the type, but it's not data that we desire when working in React, in fact it's going to cause you problems further down the line. We can clean it up though.

## TypeScript Omit & Exclude

Fortunately we can automate this clean up in a nice way that won't break as we amend our `graphql.schema` file by using TypeScripts Utility types [Omit](https://www.typescriptlang.org/docs/handbook/utility-types.html#omittype-keys) & [Exclude](https://www.typescriptlang.org/docs/handbook/utility-types.html#excludetype-excludedunion).

Create a new file `graphql/APITypes.ts` and add the export to your `graphql/index.ts` file.

Next create a new file `graphql/DeepOmit.ts` and paste in the following:

```ts
type Primitive =
  | string
  | Function
  | number
  | boolean
  | symbol
  | undefined
  | null;

type DeepOmitArray<T extends any[], K> = {
  [P in keyof T]: DeepOmit<T[P], K>;
};

export type DeepOmit<T, K> = T extends Primitive
  ? T
  : {
      [P in Exclude<keyof T, K>]: T[P] extends infer TP
        ? TP extends Primitive
          ? TP // leave primitives and functions alone
          : TP extends any[]
          ? DeepOmitArray<TP, K> // Array special handling
          : DeepOmit<TP, K>
        : never;
    };
```
> Stricly speaking DeepOmit isn't necessary in this example, you could just use Omit, however, when your schema becomes more complicated you may find DeepOmit will serve you better.

Back in `APITypes.ts` we'll import DeepOmit and our Amplify generated types:

```ts
import { DeepOmit } from './DeepOmit';
import {
  ListTodosQuery,
} from './API';
```

We can now create base types from the generated Amplify types filtering out the `null` entries and `__typename` properties. The following code does just that for the generated `GetTodoQuery` creating a new type named `TodoType`. 

```ts
export type TodoType = DeepOmit<
  Exclude<GetTodoQuery['getTodo'], null>,
  '__typename'
>;
```

This will generate a type as follows:

```ts
type TodoType = {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    createdAt: string;
    updatedAt: string;
}
```

To make use of the type in React, import it:

```ts
import {listTodos, ListTodosQuery, TodoType} from '../graphql'
```

and update the JSX telling TypeScript that each todo item is of the TodoType:

```html
  <div className={styles.grid}>
    {todos?.listTodos?.items.map((todo: TodoType) => {
      return (
        <div className={styles.card}>
          <h3>{todo.name}</h3>
          <p>Find in-depth information about Next.js features and API.</p>
        </div>
      )
    })}
  </div>
```

Intellisense now works without the erroeneous `null` and `__typename` properties.

## Changing Schema

So what happens when we extend our `schema.graphql` file? Let's find out.

In `schema.graphl` add a completed flag, so the schema becomes:

```ts
type Todo @model {
  id: ID!
  name: String!
  description: String
  completed: Boolean!
}
```

If you are still running `amplify mock` then you'll notice something neat, the code generation updates automatically as soon as you save the file. If you look in `API.ts` you see the new completed boolean in the type definitions.

What about `APITypes.ts`? Well that file hasn't been updated but it doesn't need to. It just pulls in the updated types from `API.ts` and removes `null` and `__typename`.

Let's try this out, back in our React code lets add the status of the completed flag in our UI.

```ts
   <div className={styles.card} key={todo.id}>
      <h3>{todo.name}</h3>
      <p>{todo.description}</p>
      <p>{`Status: ${todo.completed}`}</p>
   </div> 
```

When adding the status and typing the period you should have noticed how TypeScript suggested completed as an option!

If you look in the browser though you'll see status is null because we haven't set any value yet for the completed status and null is an appropriate alternative value. Let's fix that in GraphiQL

```ts
mutation MyMutation {
  updateTodo(input: {id: "8bce419d-39d5-425b-ab45-00f731e0454e", completed: true}) {
    id
  }
}
```

Sorted!

## Summary

Our app now has a nice contract between the backend and the frontend using the `GraphQL.schema` file as the glue and delivers on the promise of preventing runtime errors for both backend and frontend.

----

### Inspiration

This walkthrough is based on the groundwork of this excellent articles:

- https://dev.to/mwarger/aws-amplify-graphql-queries-with-typescript-and-hooks-1e2
- https://dev.to/stevelizcano/5-minute-tutorial-get-base-types-from-your-aws-amplify-graphql-schema-with-typescript-3636