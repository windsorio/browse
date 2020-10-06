import IDateScopeRules from "../../stdlib/datetime/interfaces/IDateScopeRules";
import IMathScopeRules from "../../stdlib/math/interfaces/IMathScopeRules";

export default interface IScope {
  parent: any;
  rules: any | IDateScopeRules | IMathScopeRules;
  vars: any;
  internal: any;
  modules: any;
  close: () => Promise<any>;
}
