local Grapeee = script:FindFirstAncestor("Grapeee")
local PluginRoot = Grapeee.Plugin
local Packages = Grapeee.Packages

local Roact = require(Packages.Roact)

local StudioPluginContext = require(script.Components.Studio.StudioPluginContext)
local StudioPluginGui = require(script.Components.Studio.StudioPluginGui)
local StudioToggleButton = require(script.Components.Studio.StudioToggleButton)
local StudioToolbar = require(script.Components.Studio.StudioToolbar)

local e = Roact.createElement

local function joinLines(lines)
	return table.concat(lines, "\n")
end

local function joinBulletLines(lines)
	return table.concat(lines, "\n- ")
end

local function buildSelectionText(selection)
	if #selection == 0 then
		return "Nothing selected in Studio yet."
	end

	return joinLines(selection)
end

local App = Roact.Component:extend("App")

function App:init()
	self.state = {
		active = false,
		snapshot = self.props.session:getState(),
	}

	self.onToggle = function()
		local nextActive = not self.state.active
		self:setState({
			active = nextActive,
		})

		if nextActive then
			self.props.session:refresh()
		end
	end

	self.onClose = function()
		self:setState({
			active = false,
		})
	end

	self.onRefresh = function()
		self.props.session:refresh()
	end
end

function App:didMount()
	self.disconnectSession = self.props.session:onChanged(function(snapshot)
		self:setState({
			snapshot = snapshot,
		})
	end)
end

function App:willUnmount()
	if self.disconnectSession then
		self.disconnectSession()
		self.disconnectSession = nil
	end
end

function App:render()
	local snapshot = self.state.snapshot
	local daemonText = snapshot.daemonReachable and "reachable" or "offline"

	return e(StudioPluginContext.Provider, {
		value = self.props.plugin,
	}, {
		Toolbar = e(StudioToolbar, {
			name = "Grapeee",
		}, {
			Button = e(StudioToggleButton, {
				name = "Grapeee",
				tooltip = "Open the Grapeee Studio runtime panel",
				icon = "rbxasset://textures/StudioSharedUI/WidgetIcons/ScriptEditor.png",
				active = self.state.active,
				onClick = self.onToggle,
			}),
		}),

		Gui = e(StudioPluginGui, {
			id = "GrapeeeStudioPlugin",
			title = "Grapeee",
			active = self.state.active,
			onClose = self.onClose,
			floatingSize = Vector2.new(420, 560),
			minimumSize = Vector2.new(320, 360),
		}, {
			Padding = e("UIPadding", {
				PaddingTop = UDim.new(0, 18),
				PaddingBottom = UDim.new(0, 18),
				PaddingLeft = UDim.new(0, 18),
				PaddingRight = UDim.new(0, 18),
			}),

			List = e("UIListLayout", {
				FillDirection = Enum.FillDirection.Vertical,
				SortOrder = Enum.SortOrder.LayoutOrder,
				Padding = UDim.new(0, 10),
				HorizontalAlignment = Enum.HorizontalAlignment.Left,
			}),

			Title = e("TextLabel", {
				LayoutOrder = 1,
				BackgroundTransparency = 1,
				Size = UDim2.new(1, 0, 0, 28),
				Font = Enum.Font.GothamBold,
				Text = "Grapeee Studio Runtime",
				TextSize = 22,
				TextColor3 = Color3.fromRGB(237, 232, 222),
				TextXAlignment = Enum.TextXAlignment.Left,
			}),

			Subtitle = e("TextLabel", {
				LayoutOrder = 2,
				BackgroundTransparency = 1,
				AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0),
				Font = Enum.Font.Gotham,
				Text = "Forked from Rojo's plugin shell and adapted for Grapeee's Studio-side runtime.",
				TextSize = 14,
				TextWrapped = true,
				TextColor3 = Color3.fromRGB(171, 177, 188),
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
			}),

			RefreshButton = e("TextButton", {
				LayoutOrder = 3,
				Size = UDim2.new(1, 0, 0, 38),
				BackgroundColor3 = Color3.fromRGB(239, 183, 83),
				BorderSizePixel = 0,
				Font = Enum.Font.GothamBold,
				Text = "Refresh Studio Snapshot",
				TextSize = 14,
				TextColor3 = Color3.fromRGB(24, 26, 31),
				[Roact.Event.Activated] = self.onRefresh,
			}),

			Status = e("TextLabel", {
				LayoutOrder = 4,
				BackgroundTransparency = 1,
				AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0),
				Font = Enum.Font.GothamBold,
				Text = string.format("Status: %s  |  Daemon: %s", snapshot.status, daemonText),
				TextSize = 14,
				TextWrapped = true,
				TextColor3 = Color3.fromRGB(237, 232, 222),
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
			}),

			Details = e("TextLabel", {
				LayoutOrder = 5,
				BackgroundTransparency = 1,
				AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0),
				Font = Enum.Font.Gotham,
				Text = string.format(
					"Place: %s\nPlaceId: %s\nSession: %s\nLast refresh: %s",
					tostring(snapshot.placeName),
					tostring(snapshot.placeId),
					tostring(snapshot.sessionId),
					tostring(snapshot.lastRefreshAt)
				),
				TextSize = 13,
				TextWrapped = true,
				TextColor3 = Color3.fromRGB(194, 199, 210),
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
			}),

			Selection = e("TextLabel", {
				LayoutOrder = 6,
				BackgroundTransparency = 1,
				AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0),
				Font = Enum.Font.Gotham,
				Text = buildSelectionText(snapshot.selection),
				TextSize = 13,
				TextWrapped = true,
				TextColor3 = Color3.fromRGB(152, 219, 190),
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
			}),

			Capabilities = e("TextLabel", {
				LayoutOrder = 7,
				BackgroundTransparency = 1,
				AutomaticSize = Enum.AutomaticSize.Y,
				Size = UDim2.new(1, 0, 0, 0),
				Font = Enum.Font.Gotham,
				Text = "Capabilities:\n- " .. joinBulletLines(snapshot.capabilities),
				TextSize = 13,
				TextWrapped = true,
				TextColor3 = Color3.fromRGB(171, 177, 188),
				TextXAlignment = Enum.TextXAlignment.Left,
				TextYAlignment = Enum.TextYAlignment.Top,
			}),
		}),
	})
end

return App
