import Head from 'next/head'
import styles from '../styles/Home.module.css'
import * as React from 'react';
import Amplify from "aws-amplify";
import GraphQLAPI, { GRAPHQL_AUTH_MODE } from '@aws-amplify/api-graphql';
import awsExports from "../aws-exports";
import {listTodos, ListTodosQuery, TodoType} from '../graphql'
Amplify.configure(awsExports);

export default function Home() {
  const [todos, setTodos] = React.useState<ListTodosQuery | undefined>(undefined); 

  React.useEffect(() => {
    const fetchTodos = async () => {
      try {
        const response = (await GraphQLAPI.graphql({
          query: listTodos,
          authMode: GRAPHQL_AUTH_MODE.API_KEY
        })) as { data: ListTodosQuery }
        console.log(response);
        setTodos(response.data);
      } catch (error) {
        console.log(error);
      }
    };
  
    fetchTodos();
  }, []);
  
  return (
    <div className={styles.container}>
      <Head>
        <title>Create Next App</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className={styles.main}>
        <h1 className={styles.title}>
          Welcome to <a href="https://nextjs.org">Next.js!</a>
        </h1>

        <p className={styles.description}>
          Get started by editing{' '}
          <code className={styles.code}>pages/index.js</code>
        </p>

        <div className={styles.grid}>
          {todos?.listTodos?.items.map((todo: TodoType) => {
            return (
              <div className={styles.card} key={todo.id}>
                <h3>{todo.name}</h3>
                <p>{todo.description}</p>
                <p>{`Status: ${todo.completed}`}</p>
              </div>              
            )
          })}
        </div>
      </main>

      <footer className={styles.footer}>
        <a
          href="https://vercel.com?utm_source=create-next-app&utm_medium=default-template&utm_campaign=create-next-app"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/vercel.svg" alt="Vercel Logo" className={styles.logo} />
        </a>
      </footer>
    </div>
  )
}
