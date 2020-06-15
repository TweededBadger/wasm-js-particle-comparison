import _ from "lodash";
// import * as benchmark from 'bench';
const benchmark = require("benchmark");
const Benchmark = benchmark.runInContext({ _ });
// @ts-ignore
window.Benchmark = Benchmark;

export const runBenchmark = async (
  tests: {
    label: string;
    func: Function;
  }[],
  debug: Function = console.log
):Promise<string> => {
  debug("Running benchmark....");
  var suite = new Benchmark.Suite();

  for (const test of tests) {
    suite.add(test.label, test.func);
  }

  let result = "";

  const promise = new Promise<string>(resolve => {
    suite
    .on("cycle", function (event) {
      result += String(event.target) + "\n";
      debug(String(event.target));
    })
    .on("complete", function () {
      console.log(this);
      const f = "Fastest is " + this.filter("fastest").map("name");
      result += f + "\n";
      debug(result);
      resolve(result as string);
    })
    // run async
    .run({ async: true });
  } );


  return promise;
  
};
