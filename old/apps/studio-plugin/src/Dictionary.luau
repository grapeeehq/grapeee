local Dictionary = {}

function Dictionary.merge(...)
	local result = {}

	for _, source in { ... } do
		if source ~= nil then
			for key, value in source do
				result[key] = value
			end
		end
	end

	return result
end

return Dictionary
