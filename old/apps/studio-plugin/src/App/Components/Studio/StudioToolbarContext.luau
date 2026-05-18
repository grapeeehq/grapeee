local Grapeee = script:FindFirstAncestor("Grapeee")
local Packages = Grapeee.Packages

local Roact = require(Packages.Roact)

local StudioToolbarContext = Roact.createContext(nil)

return StudioToolbarContext
