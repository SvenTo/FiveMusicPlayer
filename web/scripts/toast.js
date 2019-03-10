/**
 * Shows some information for a short time on the site like the Toasts in Android
 * @returns {Toast}
 * @author Sven Nobis
 */
function Toast() {
	/**
	 * @type String
	 */
	var elementName = '#toast';
	/**
	 * @type Element
	 */
	var element = document.querySelector(elementName);
	var innerElement = document.querySelector(elementName + ' > div');
	var toastQueue = new Array();

	/**
	 * Shows a toast
	 * @param htmlText Some text formatted with HTML
	 */
	this.show = function(htmlText) {
		toastQueue.push(htmlText);
	
		if(!anyToastVisble()) {
			nextToast();
		}
	};
	
	/**
	 * Returns true, if any toast is currently visible 
	 * @returns {Boolean}
	 */
	function anyToastVisble() {
		return (toastQueue.length > 1);
	}
	
	/**
	 * Shows the next toast, if there is any in the queue
	 */
	function nextToast() {
		if(toastQueue.length > 0) {
			setHTML(toastQueue[0]);
			element.className = '';
			window.setTimeout(setInivisble, 3000);
			window.setTimeout(toastShown, 4001);
		}
	}

	function setHTML(htmlText) {
		innerElement.innerHTML =  htmlText;
	}
	
	function setInivisble() {
		element.style.opacity = 0;
	};

	function toastShown() {
		element.style.opacity = 1;
		element.className = 'toastInvisible';
		toastQueue.shift();
		nextToast();
	};
}