if not plugin then
	return
end

local Grapeee = script:FindFirstAncestor("Grapeee")
local Packages = Grapeee.Packages

local Roact = require(Packages.Roact)

local CapabilityRegistry = require(script.Core.CapabilityRegistry)
local DaemonClient = require(script.Core.DaemonClient)
local Session = require(script.Core.Session)

local statusCapability = require(script.Capabilities.StudioStatus)
local selectionCapability = require(script.Capabilities.Selection)
local treeSearchCapability = require(script.Capabilities.TreeSearch)
local scriptReadCapability = require(script.Capabilities.ScriptRead)

local App = require(script.App)

local registry = CapabilityRegistry.new()
registry:register("studio.status.get", statusCapability)
registry:register("studio.selection.get", selectionCapability)
registry:register("studio.tree.search", treeSearchCapability)
registry:register("studio.script.read", scriptReadCapability)

local daemonClient = DaemonClient.new("http://127.0.0.1:8787")
local session = Session.new(plugin, daemonClient, registry)

local app = Roact.createElement(App, {
	plugin = plugin,
	session = session,
})

local tree = Roact.mount(app, game:GetService("CoreGui"), "Grapeee UI")

plugin.Unloading:Connect(function()
	session:destroy()
	Roact.unmount(tree)
end)
