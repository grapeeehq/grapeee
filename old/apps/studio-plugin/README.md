# Studio Plugin

This app is Grapeee's actual Roblox Studio plugin target.

It is separate from `apps/companion` on purpose:

- `apps/companion` is the local daemon that owns filesystem access and local tooling.
- `apps/studio-plugin` is the Studio-side runtime that owns live Studio context.

## Goals

The first slice of the plugin should:

- fork the Rojo Studio plugin shell instead of inventing one from scratch
- boot inside Roblox Studio as a real plugin
- render a dock widget through the Rojo-style toolbar and widget wrappers
- report Studio session metadata
- expose read-only context helpers
- ping the local daemon so registration can be layered in next

## Layout

- `src/init.server.luau`
  - plugin entrypoint
- `src/App`
  - forked plugin shell modeled after Rojo's Studio plugin architecture
- `src/Core`
  - plugin runtime modules
- `src/Capabilities`
  - read-only Studio capability implementations
- `Packages/Roact`
  - vendored Roact runtime used by the forked plugin shell

## Local development

This project is Rojo-friendly and intended to be loaded through Studio plugin workflows.

Suggested loop:

1. Run `rojo serve` from `apps/studio-plugin`
2. Open Roblox Studio
3. Sync the project into a plugin development target
4. Use the Plugin Debugger or Save and Reload Plugin workflow in Studio

References:

- [Roblox Studio plugins](https://create.roblox.com/docs/studio/plugins)
- [Studio widgets](https://create.roblox.com/docs/studio/build-studio-widgets)
- [Rojo project format](https://rojo.space/docs/v7/project-format/)
- [Rojo plugin source](https://github.com/rojo-rbx/rojo/tree/master/plugin)
