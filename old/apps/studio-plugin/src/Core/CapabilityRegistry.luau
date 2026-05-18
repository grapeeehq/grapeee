local CapabilityRegistry = {}
CapabilityRegistry.__index = CapabilityRegistry

function CapabilityRegistry.new()
	return setmetatable({
		handlers = {},
	}, CapabilityRegistry)
end

function CapabilityRegistry:register(name, handler)
	self.handlers[name] = handler
end

function CapabilityRegistry:invoke(name, context, input)
	local handler = self.handlers[name]

	if handler == nil then
		return {
			ok = false,
			error = "Unknown capability: " .. name,
		}
	end

	local ok, result = pcall(handler.run, context, input)

	if ok then
		return {
			ok = true,
			payload = result,
		}
	end

	return {
		ok = false,
		error = result,
	}
end

return CapabilityRegistry
