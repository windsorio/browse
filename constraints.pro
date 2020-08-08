not_excluded(WorkspaceCwd) :- 
  (
    member(WorkspaceCwd, ['.', '_repo'])
  ) -> false ; true.

% public packages start with @browselang/
gen_enforced_field(WorkspaceCwd, 'private', 'true') :- 
  workspace_field(WorkspaceCwd, 'name', Name),
  \+ atom_concat('@browselang/', _, Name).

% License
gen_enforced_field(WorkspaceCwd, 'license', 'MIT') :-
  workspace(WorkspaceCwd),
  \+ workspace_field(WorkspaceCwd, 'private', _).
% Descriptions
gen_enforced_field(WorkspaceCwd, 'description', '<some description>') :-
  \+ workspace_field(WorkspaceCwd, 'private', 'true'),
  \+ workspace_field(WorkspaceCwd, 'description', _).

% Metadata
gen_enforced_field(WorkspaceCwd, 'repository.type', 'git') :-
  workspace_ident(WorkspaceCwd, Name),
  \+ workspace_field_test(WorkspaceCwd, 'private', 'true').
gen_enforced_field(WorkspaceCwd, 'repository.url', 'git+https://github.com/windsorio/browse.git') :-
  workspace_ident(WorkspaceCwd, Name),
  \+ workspace_field_test(WorkspaceCwd, 'private', 'true').
gen_enforced_field(WorkspaceCwd, 'bugs.url', 'https://github.com/windsorio/browse/issues') :-
  workspace_ident(WorkspaceCwd, Name),
  \+ workspace_field_test(WorkspaceCwd, 'private', 'true').
gen_enforced_field(WorkspaceCwd, 'engines', null) :-
  workspace_ident(WorkspaceCwd, Name).

% % Scripts
% gen_enforced_field(WorkspaceCwd, 'scripts.lint', '<some script>') :-
%   not_excluded(WorkspaceCwd),
%   \+ workspace_field(WorkspaceCwd, 'scripts.lint', _).

% gen_enforced_field(WorkspaceCwd, 'scripts.build', '<some script>') :-
%   not_excluded(WorkspaceCwd),
%   \+ workspace_field(WorkspaceCwd, 'scripts.build', _).

% gen_enforced_field(WorkspaceCwd, 'scripts.prepack', '<some script>') :-
%   \+ workspace_field(WorkspaceCwd, 'private', 'true'),
%   \+ workspace_field(WorkspaceCwd, 'scripts.prepack', _).


% This rule will enforce that a workspace MUST depend on the same version of a dependency as the one used by the other workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType) :-
  workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  workspace_has_dependency(OtherWorkspaceCwd, DependencyIdent, DependencyRange2, DependencyType2),
  ((
    atom_concat('workspace:', _, DependencyRange) ;
    atom_concat('workspace:', _, DependencyRange2)
  )
     -> false ; true).

% This rule enforces that all packages that depend on TypeScript must also depend on tslib
gen_enforced_dependency(WorkspaceCwd, 'tslib', 'range', 'dependencies') :-
  % Iterates over all TypeScript dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, 'typescript', _, DependencyType),
  % Ignores the case when TypeScript is a peer dependency
    DependencyType \= 'peerDependencies',
  % Only proceed if the workspace doesn't already depend on tslib
    \+ workspace_has_dependency(WorkspaceCwd, 'tslib', _, _).

% This rule will prevent workspaces from depending on non-workspace versions of available workspaces
gen_enforced_dependency(WorkspaceCwd, DependencyIdent, WorkspaceRange, DependencyType) :-
  % Iterates over all dependencies from all workspaces
    workspace_has_dependency(WorkspaceCwd, DependencyIdent, DependencyRange, DependencyType),
  % Only consider those that target something that could be a workspace
    workspace_ident(DependencyCwd, DependencyIdent),
  % Obtain the version from the dependency
    workspace_field(DependencyCwd, 'version', DependencyVersion),
  % Quirk: we must discard the workspaces that don't declare a version
    atom(DependencyVersion),
  % Derive the expected range from the version
    atom_concat('workspace:', DependencyCwd, WorkspaceRange)
