function log(message: string, error?: Error) {
  console.log(`${new Date().toISOString()} ${message}`, error ? error : '');
}

export { log };
