local TreeSearch = {}

local function normalizeQuery(input)
	local query = input and input.query or ""
	return string.lower(query)
end

function TreeSearch.run(_session, input)
	local query = normalizeQuery(input)
	local limit = input and input.limit or 25
	local matches = {}

	for _, instance in game:GetDescendants() do
		if query == "" or string.find(string.lower(instance.Name), query, 1, true) then
			table.insert(matches, {
				name = instance.Name,
				className = instance.ClassName,
				fullName = instance:GetFullName(),
			})
		end

		if #matches >= limit then
			break
		end
	end

	return matches
end

return TreeSearch
