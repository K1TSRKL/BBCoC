'use strict';

/**
 * Manages the display and lifecycle of toast notifications.
 * Maintains a queue of toasts to display and limits the number of
 * concurrently visible toasts.
 */
var ToastManager = new class ToastManager {
	/**
	 * Queue of toast options waiting to be displayed.
	 * @type {Required<Toasts.Options>[]}
	 */
	queue = [];
	/**
	 * Tracks the number of active (visible) toasts.
	 * @type {number}
	 */
	active = 0;
	/**
	 * Maximum number of toast buddies that can chill together in one spot.
	 * @type {number}
	 * @static
	 */
	static maxStack = 3;

	/**
	 * Show an info toast, because you need to know stuff.
	 *
	 * @param {string} msg - Text content of the toast.
	 * @param {Omit<Toasts.Options, 'message' | 'type'>} [opts={}] - Other toast options.
	 */
	info(msg, opts = {}) { this._show({ icon: '../Icons/info_circle.svg', ...opts, message: msg, type: 'info' }); }

	/**
	 * Show a success toast. It's time to celebrate! 🎉
	 *
	 * @param {string} msg - Text content of the toast.
	 * @param {Omit<Toasts.Options, 'message' | 'type'>} [opts={}] - Other toast options.
	 */
	success(msg, opts = {}) { this._show({ icon: '../Icons/check_circle.svg', ...opts, message: msg, type: 'success' }); }

	/**
	 * Show a warning toast. Watch out, things might explode!
	 *
	 * @param {string} msg - Text content of the toast.
	 * @param {Omit<Toasts.Options, 'message' | 'type'>} [opts={}] - Other toast options.
	 */
	warning(msg, opts = {}) { this._show({ icon: '../Icons/exclamation_triangle.svg', ...opts, message: msg, type: 'warning' }); }

	/**
	 * Show an error toast. Oh noes, something broke.
	 *
	 * @param {string} msg - Text content of the toast.
	 * @param {Omit<Toasts.Options, 'message' | 'type'>} [opts={}] - Other toast options.
	 */
	error(msg, opts = {}) { this._show({ icon: '../Icons/cross_circle.svg', ...opts, message: msg, type: 'error' }); }

	/**
	 * Show a custom toast, because you're special.
	 *
	 * @param {string} msg - Text content of the toast.
	 * @param {Toasts.Type} type - Custom type string or one of the predefined types.
	 * @param {Omit<Toasts.Options, 'message' | 'type'>} [opts={}] - Other toast options.
	 */
	custom(msg, type, opts = {}) { this._show({ ...opts, message: msg, type: type }); }

	/**
	 * Kick out every single visible toast regardless of type.
	 *
	 * @returns {void}
	 */
	dismissAll() {
		/** @type {NodeListOf<Toasts.ToastElement>} */
		const toasts = document.querySelectorAll('.toast');
		toasts.forEach((toast) => {
			toast._dismiss?.('external');
		});
	}

	/**
	 * Kicks out all toasts of a particular style.
	 *
	 * @param {Toasts.Type} type - The type of toasts to dismiss (e.g., 'info', 'error').
	 * @returns {void}
	 */
	dismissByType(type) {
		/** @type {NodeListOf<Toasts.ToastElement>} */
		const toasts = document.querySelectorAll(`.toast.${type}`);
		toasts.forEach((toast) => {
			toast._dismiss?.('external');
		});
		this.queue = this.queue.filter(t => t.type !== type);
	}

	/**
	 * Kicks out all toasts of a category.
	 *
	 * @param {string} category - The type of toasts to dismiss (e.g., 'info', 'error').
	 * @returns {void}
	 */
	dismissByCategory(category) {
		/** @type {NodeListOf<Toasts.ToastElement>} */
		const toasts = document.querySelectorAll(`.toast[data-category=${category}]`);
		toasts.forEach((toast) => {
			toast._dismiss?.('external');
		});
		this.queue = this.queue.filter(t => t.category !== category);
	}

	/**
	 * Enqueues a new toast to be displayed with the given options.
	 * Fills in any missing option fields with default values, then
	 * attempts to process the queue to show toasts if slots are available.
	 *
	 * @private
	 * @param {Toasts.Options} options - Configuration for the toast.
	 * @returns {void}
	 */
	_show(options) {
		if (!options.message) {
			console.warn('What are you even trying to show? Missing toast message.');
			return;
		}

		options.title ??= '';
		options.type ??= 'base';
		options.duration ??= 3000;
		options.duration = Math.max(0, options.duration);
		options.progress ??= true;
		options.stopProgressOnHover ??= true;
		options.iconColor ??= 'default';
		options.clampMessage ??= true;

		this.queue.push(/** @type {Required<Toasts.Options>} */(options));
		this._process();
	}

	/**
	 * Internal method that iterates through the queue and displays any toast
	 * if the active count is not currently at max capacity. Removes displayed toasts
	 * from the queue and updates the active count.
	 *
	 * @private
	 * @returns {void}
	 */
	_process() {
		for (let i = 0; i < this.queue.length; i++) {
			const toast = this.queue[i];
			const count = this.active || 0;
			if (count < ToastManager.maxStack) {
				this.queue.splice(i, 1);
				this._display(toast);
				i--;
			}
		}
	}

	/**
	 * Builds the toast element, hooks up animations, buttons, and timers,
	 * and tracks its lifetime until Void kidnaps it.
	 *
	 * @private
	 * @param {Required<Toasts.Options>} _ - Fully resolved options for the toast to display.
	 * @returns {void}
	 */
	_display(_) {
		const container = this._getOrCreateContainer();
		const prefersReducedMotion = CommonPrefersReducedMotion();
		this.active = (this.active || 0) + 1;

		/** @param {Toasts.CloseReason} reason */
		const remove = (reason) => {
			_.onClose?.(toast, reason);

			const removeAndProcess = () => {
				toast._timeoutTimerRemove?.();
				toast.remove();
				this.active--;
				this._process();
			};

			if (prefersReducedMotion) {
				removeAndProcess();
			} else {
				toast.classList.remove('show');
				const listener = () => {
					removeAndProcess();
				};
				toast.addEventListener('transitionend', listener, { once: true });
				toast.addEventListener('transitioncancel', listener, { once: true });
			}
		};

		const clampClass = _.clampMessage ? 'toast-clamp-message' : 'scroll-box';

		/** @type {Toasts.ToastElement} */
		const toast = ElementCreate({
			tag: 'div',
			classList: ['toast', _.type],
			dataAttributes: {
				category: _.category
			},
			attributes: {
				role: 'status',
			},
			children: [
				_.icon ? {
					tag: 'div',
					classList: ['toast-icon', _.iconColor],
					style: {
						'--toast-icon': `url(${_.icon})`
					}
				} : null,
				{
					tag: 'div',
					classList: ['toast-content'],
					children: [
						_.title ? {
							tag: 'span',
							classList: ['toast-title'],
							children: [_.title],
						} : null,
						{
							tag: 'span',
							classList: ['toast-message', clampClass],
							children: [_.message],
						},
						Array.isArray(_.buttons) ? {
							tag: 'div',
							classList: ['toast-buttons'],
							children: _.buttons.map(({ label, onClick: onClick }) =>
								ElementButton.Create(null,
									function(ev) {
										ev.stopPropagation();
										onClick?.call(this, ev, toast);
									},
									{
										label
									},
									{
										button: {
											classList: ['toast-button'],
										},
										label: {
											style: {
												'background-color': 'transparent'
											}
										}
									}
								)
							)
						} : null,
					]
				},
				{
					tag: 'button',
					classList: ['toast-dismiss'],
					eventListeners: {
						click: (ev) => {
							ev.stopPropagation();
							remove('click');
						}
					},
				},
				_.progress && _.duration > 0 ? {
					tag: 'progress',
					classList: ['progress-bar'],
					attributes: { max: _.duration }
				} : null
			],
			eventListeners: {
				click: (ev) => {
					ev.stopPropagation();
					_.onClick?.(ev, toast);
					remove('click');
				}
			},
			parent: container
		});

		requestAnimationFrame(() => toast.classList.add('show'));

		_.onShow?.(toast);

		if (_.progress && _.duration > 0) {
			// Can safely cast; the progress element is always created when the `_.progress` parameter is passed
			const progressBar = /** @type {HTMLProgressElement} */(toast.querySelector('progress'));
			progressBar.value = 0;

			const timerRemove = this._animateProgress(progressBar, () => remove('timeout'), _.duration);
			toast._timeoutTimerRemove = timerRemove;

			if (_.stopProgressOnHover) {
				toast.addEventListener('mouseover', () => {
					progressBar.setAttribute('data-pause-timer', '');
				});

				toast.addEventListener('mouseout', () => {
					progressBar.removeAttribute('data-pause-timer');
				});
			}
		} else if (_.duration > 0) {
			let duration = _.duration;
			const steps = 100;
			const stepValue = (duration / steps);

			let timerRemove = TimerCreate(() => {
				duration -= stepValue;

				if (duration <= 0) {
					timerRemove();
					remove('timeout');
				}
			}, stepValue, true, 'foreground');

			toast._timeoutTimerRemove = timerRemove;
		}

		toast._dismiss = remove;
	}

	/**
	 * Retrieves an existing container element for toasts, or creates a new one if none exists.
	 *
	 * @private
	 * @returns {HTMLDivElement} The container <div> element.
	 */
	_getOrCreateContainer() {
		const position = 'top-right';
		let container = /** @type {null | HTMLDivElement} */(document.querySelector(`.toast-container[data-pos="${position}"]`));
		if (!container) {
			container = ElementCreate({
				tag: 'div',
				classList: ['toast-container', position],
				dataAttributes: { pos: position },
				parent: document.body
			});
		}
		return container;
	}

	/**
	 * Animates the <progress> element from 0 to its max value over the specified duration.
	 * Calls onFinish when the progress reaches its maximum. Returns a function that can
	 * be called to stop the animation prematurely.
	 *
	 * @private
	 * @param {HTMLProgressElement} progress - The <progress> element to animate.
	 * @param {() => void | undefined} onFinish - Callback invoked when the animation completes.
	 * @param {number} durationMs - Total time in milliseconds for the progress to fill.
	 * @returns {() => void} Function to call to cancel the progress animation timer.
	 */
	_animateProgress(progress, onFinish, durationMs) {
		const steps = 100;
		const stepValue = (progress.max / steps);
		const interval = durationMs / steps;

		progress.style.direction = 'rtl';
		progress.value = 0;

		let timerRemove = TimerCreate(() => {
			if (progress.hasAttribute('data-pause-timer')) return;

			progress.value += stepValue;

			if (progress.value >= progress.max) {
				timerRemove();
				onFinish?.();
			}
		}, interval, true, 'universal');

		return timerRemove;
	}
};
