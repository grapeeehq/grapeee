local ScriptRead = {}

local function findByFullName(fullName)
	if not fullName or fullName == "" then
		return nil
	end

	for _, instance in game:GetDescendants() do
		if instance:GetFullName() == fullName then
			return instance
		end
	end

	return nil
end

function ScriptRead.run(_session, input)
	local target = findByFullName(input and input.fullName)

	if target == nil then
		error("Script target not found")
	end

	if not target:IsA("LuaSourceContainer") then
		error("Target is not a script")
	end

	return {
		name = target.Name,
		className = target.ClassName,
		fullName = target:GetFullName(),
		source = target.Source,
	}
end

return ScriptRead
