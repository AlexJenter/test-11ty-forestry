/* eslint-disable */
<:
	modules
		.forEach(function(module) {
:>
import <:= module.name :> from '<:= module.path :>';<:
	});
:>

<:
	modules
		.forEach(function(module) {
:>
export { <:= module.name :> };
<:
	});
:>

export default true;
