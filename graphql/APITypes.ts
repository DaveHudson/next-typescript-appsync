import { DeepOmit } from './DeepOmit';
import {
  GetTodoQuery,
} from './API';

// https://dev.to/stevelizcano/5-minute-tutorial-get-base-types-from-your-aws-amplify-graphql-schema-with-typescript-3636
// https://github.com/dantasfiles/TSAmplifyAPI
// https://dev.to/mwarger/aws-amplify-graphql-queries-with-typescript-and-hooks-1e2

export type TodoType = DeepOmit<
  GetTodoQuery['getTodo'],
  '__typename'
>;