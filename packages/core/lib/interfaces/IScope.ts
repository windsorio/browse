export default interface IScope {
  parent: any;
  rules: object;
  vars: object;
  internal: object;
  modules: object;
  close: () => Promise<any>;
}
