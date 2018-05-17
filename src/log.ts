function log(message: string, exception: any='') {
  console.log(`${new Date().toISOString()} ${message}`, exception);
}

export { log };
