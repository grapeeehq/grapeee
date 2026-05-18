local Selection = game:GetService("Selection")

local SelectionCapability = {}

function SelectionCapability.run()
	local items = Selection:Get()
	local payload = {}

	for _, item in items do
		table.insert(payload, {
			name = item.Name,
			className = item.ClassName,
			fullName = item:GetFullName(),
		})
	end

	return payload
end

return SelectionCapability
