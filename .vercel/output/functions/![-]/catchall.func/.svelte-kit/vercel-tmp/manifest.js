export const manifest = (() => {
function __memo(fn) {
	let value;
	return () => value ??= (value = fn());
}

return {
	appDir: "_app",
	appPath: "_app",
	assets: new Set(["favicon.svg","icon.svg"]),
	mimeTypes: {".svg":"image/svg+xml"},
	_: {
		client: {start:"_app/immutable/entry/start.8ObWKVI6.js",app:"_app/immutable/entry/app.CuofHqEI.js",imports:["_app/immutable/entry/start.8ObWKVI6.js","_app/immutable/chunks/DOq36Z9A.js","_app/immutable/chunks/5tG94RWQ.js","_app/immutable/chunks/UrarbisR.js","_app/immutable/entry/app.CuofHqEI.js","_app/immutable/chunks/DOq36Z9A.js","_app/immutable/chunks/C153a-zD.js","_app/immutable/chunks/P3oXUOYe.js","_app/immutable/chunks/UrarbisR.js","_app/immutable/chunks/BXUVq8do.js","_app/immutable/chunks/DtU_UbgQ.js"],stylesheets:[],fonts:[],uses_env_dynamic_public:false},
		nodes: [
			__memo(() => import('../output/server/nodes/0.js')),
			__memo(() => import('../output/server/nodes/1.js')),
			__memo(() => import('../output/server/nodes/2.js'))
		],
		remotes: {
			
		},
		routes: [
			{
				id: "/",
				pattern: /^\/$/,
				params: [],
				page: { layouts: [0,], errors: [1,], leaf: 2 },
				endpoint: null
			}
		],
		prerendered_routes: new Set([]),
		matchers: async () => {
			
			return {  };
		},
		server_assets: {}
	}
}
})();
