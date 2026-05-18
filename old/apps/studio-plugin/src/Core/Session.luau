local HttpService = game:GetService("HttpService")
local Selection = game:GetService("Selection")
local Session = {}
Session.__index = Session

local function buildSessionId()
	return HttpService:GenerateGUID(false)
end

local function getSelectionNames()
	local items = Selection:Get()
	local names = {}

	for _, item in items do
		table.insert(names, item:GetFullName())
	end

	return names
end

function Session.new(plugin, daemonClient, registry)
	local self = setmetatable({}, Session)

	self.plugin = plugin
	self.daemonClient = daemonClient
	self.registry = registry
	self.listeners = {}
	self.state = {
		sessionId = buildSessionId(),
		placeName = game.Name,
		placeId = game.PlaceId,
		jobId = game.JobId,
		selection = {},
		status = "booting",
		daemonReachable = false,
		lastDaemonError = nil,
		lastHeartbeatAt = nil,
		lastRefreshAt = nil,
		capabilities = {
			"studio.status.get",
			"studio.selection.get",
			"studio.tree.search",
			"studio.script.read",
		},
	}

	self:_attachSignals()
	return self
end

function Session:_attachSignals()
	table.insert(self.listeners, Selection.SelectionChanged:Connect(function()
		self.state.selection = getSelectionNames()
		self.state.lastRefreshAt = DateTime.now():ToIsoDate()
		self:_emitChanged()
	end))
end

function Session:getState()
	return self.state
end

function Session:onChanged(callback)
	table.insert(self.listeners, callback)

	return function()
		for index, listener in self.listeners do
			if listener == callback then
				table.remove(self.listeners, index)
				break
			end
		end
	end
end

function Session:_emitChanged()
	for _, listener in self.listeners do
		if typeof(listener) == "RBXScriptConnection" then
			continue
		end

		listener(self.state)
	end
end

function Session:refresh()
	self.state.placeName = game.Name
	self.state.placeId = game.PlaceId
	self.state.jobId = game.JobId
	self.state.selection = getSelectionNames()
	self.state.lastRefreshAt = DateTime.now():ToIsoDate()

	local status = self.registry:invoke("studio.status.get", self, {})
	self.state.status = status.ok and "connected" or "error"

	local health = self.daemonClient:getHealth()
	self.state.daemonReachable = health.ok == true
	self.state.lastDaemonError = health.ok and nil or health.error
	self.state.lastHeartbeatAt = DateTime.now():ToIsoDate()

	self:_emitChanged()
end

function Session:invokeCapability(name, input)
	return self.registry:invoke(name, self, input or {})
end

function Session:destroy()
	for _, listener in self.listeners do
		if typeof(listener) == "RBXScriptConnection" then
			listener:Disconnect()
		end
	end

	self.listeners = {}
end

return Session
