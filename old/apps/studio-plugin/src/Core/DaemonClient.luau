local HttpService = game:GetService("HttpService")

local DaemonClient = {}
DaemonClient.__index = DaemonClient

function DaemonClient.new(baseUrl)
	return setmetatable({
		baseUrl = string.gsub(baseUrl, "/$", ""),
	}, DaemonClient)
end

function DaemonClient:getHealth()
	return self:_request("GET", "/health")
end

function DaemonClient:postSessionSnapshot(snapshot)
	return self:_request("POST", "/studio-plugin/session-snapshot", snapshot)
end

function DaemonClient:_request(method, path, body)
	local ok, response = pcall(function()
		return HttpService:RequestAsync({
			Url = self.baseUrl .. path,
			Method = method,
			Headers = {
				["Content-Type"] = "application/json",
			},
			Body = body and HttpService:JSONEncode(body) or nil,
		})
	end)

	if not ok then
		return {
			ok = false,
			error = response,
		}
	end

	local decodedBody = response.Body

	if type(response.Body) == "string" and response.Body ~= "" then
		local decodeOk, parsed = pcall(function()
			return HttpService:JSONDecode(response.Body)
		end)

		if decodeOk then
			decodedBody = parsed
		end
	end

	return {
		ok = response.Success,
		statusCode = response.StatusCode,
		body = decodedBody,
	}
end

return DaemonClient
