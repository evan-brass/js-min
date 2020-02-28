import Swappable from './swappable.mjs';

// TODO: Probably split these into two files with better names

export function exchange_users(oldUser, newUser, part) {
	if (oldUser) {
		if (oldUser instanceof Swappable) {
			const swapper = Swappable.get(oldUser);
			if (swapper.canSwap(newUser)) {
				return swapper.doSwap(newUser);
			}
			else {
				oldUser.unbind(part);
				newUser.bind(part);
				return newUser;
			}
		} else {
			oldUser.unbind(part);
			newUser.bind(part)
			return newUser;
		}
	} else {
		newUser.bind(part);
		return newUser;
	}
}

export function verifyUser(user, part) {
	if (!user.acceptTypes.has(part.type)) {
		throw new Error(`This user accepts types: ${Array.from(user.acceptTypes.values()).join(', ')} and cannot be bound to a part of type: ${part.type}`);
	}
}