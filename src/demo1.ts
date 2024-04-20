/* eslint-disable @typescript-eslint/no-explicit-any */
const run = async () => {
  // console.clear();
};
export default run;
console.clear();
type Resolve<T> = (value?: T | PromiseLike<T>) => void;
type Reject = (reason?: any) => void;
type Executor<T> = (resolve: Resolve<T>, reject: Reject) => void;

enum PromiseState {
  Pending = "pending",
  Resolved = "resolved",
  Rejected = "rejected",
}

class MyPromise<T> {
  private state: PromiseState = PromiseState.Pending;
  private value: T | undefined;
  private callbacks: {
    onResolved: (value: T) => void;
    onRejected: (reason: any) => void;
  }[] = [];

  constructor(executor: Executor<T>) {
    const resolve: Resolve<T> = (value?: T | PromiseLike<T>) => {
      if (this.state !== PromiseState.Pending) return;
      this.state = PromiseState.Resolved;
      this.value = value as T;
      this.callbacks.forEach((callback) => callback.onResolved(value as T));
    };

    const reject: Reject = (reason?: any) => {
      if (this.state !== PromiseState.Pending) return;
      this.state = PromiseState.Rejected;
      this.value = reason;
      this.callbacks.forEach((callback) => callback.onRejected(reason));
    };

    try {
      executor(resolve, reject);
    } catch (error) {
      reject(error);
    }
  }

  then<U>(
    onResolved?: (value: T) => U | PromiseLike<U>,
    onRejected?: (reason: any) => any
  ): MyPromise<U> {
    onResolved =
      typeof onResolved === "function"
        ? onResolved
        : (value) => value as unknown as U;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (reason) => {
            throw reason;
          };

    return new MyPromise<U>((resolve, reject) => {
      const handleCallback = () => {
        setTimeout(() => {
          try {
            if (this.state === PromiseState.Resolved) {
              const result = onResolved!(this.value!);
              console.log("result", result);
              resolvePromise(result, resolve, reject);
            } else if (this.state === PromiseState.Rejected) {
              console.log("rejected", this.value);
              const result = onRejected!(this.value);
              resolvePromise(result, resolve, reject);
            } else {
              console.log("pending");
              this.callbacks.push({
                onResolved: (value: T) => {
                  const result = onResolved!(value);
                  resolvePromise(result, resolve, reject);
                },
                onRejected: (reason: any) => {
                  const result = onRejected!(reason);
                  resolvePromise(result, resolve, reject);
                },
              });
            }
          } catch (error) {
            reject(error);
          }
        });
      };

      handleCallback();
    });
  }

  catch<U>(onRejected?: (reason: any) => U | PromiseLike<U>): MyPromise<U> {
    return this.then(undefined, onRejected);
  }
}

function resolvePromise<T, U>(
  result: T | PromiseLike<T>,
  resolve: Resolve<U>,
  reject: Reject
): void {
  if (result instanceof MyPromise) {
    result.then(resolve, reject);
  } else {
    resolve(result as unknown as U);
  }
}

const p1 = new MyPromise<number>((resolve, reject) => {
  try {
    setTimeout(() => {
      resolve(1);
    }, 1000);
  } catch (error) {
    reject(error);
  }
});
p1
  //33
  .then((...arg) => {
    console.log("then1", ...arg);
    return "第一次then返回的值";
    // return new MyPromise<any>((resolve) => {
    //   setTimeout(() => {
    //     resolve(2);
    //   }, 1000);
    // });
  })
  //44
  .then((...arg) => {
    console.log("then2", ...arg);
    return new MyPromise<any>((resolve) => {
      setTimeout(() => {
        resolve(1);
      }, 1000);
    });
  })
  .then((...arg) => {
    console.log("then3", ...arg);
  });

console.log(p1);
