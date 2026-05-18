local StudioStatus = {}

function StudioStatus.run(session)
	local state = session:getState()

	return {
		sessionId = state.sessionId,
		placeName = state.placeName,
		placeId = state.placeId,
		jobId = state.jobId,
		selectionCount = #state.selection,
		daemonReachable = state.daemonReachable,
		lastHeartbeatAt = state.lastHeartbeatAt,
	}
end

return StudioStatus
