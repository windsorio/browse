export default interface IScope {
  parent: any;
  rules: any;
  vars: any;
  internal: any;
  modules: any;
  close: () => Promise<any>;
}
