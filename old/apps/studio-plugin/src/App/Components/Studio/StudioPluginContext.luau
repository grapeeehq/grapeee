local Grapeee = script:FindFirstAncestor("Grapeee")
local Packages = Grapeee.Packages

local Roact = require(Packages.Roact)

local StudioPluginContext = Roact.createContext(nil)

return StudioPluginContext
