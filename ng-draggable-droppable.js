angular.module("ngDraggableDroppable")
	.directive("ngDraggable", ["$parse", "$injector", "$document", ngDraggable])
	.directive("ngDroppable", ["$injector", ngDroppable]);


function ngDraggable($parse, $injector, $document) {
	return {
		restrict: "A",
		scope: {
			payload: "=",
			nestedPayload: "=",
			onDragStart: "&",
			onDragOverElement: "&",
			onDragComplete: "&",
			onDragFail: "&",
			onDragEnd: "&"
		},
		compile: function compile(tElement, tAttrs, transclude) {
			return {
				pre: function preLink(scope, lElement, attrs, controller) {},
				post: function postLink(scope, lElement, attrs, controller) {
					//Firefox needs to have a draggable attribute and an ondragstart
					$(lElement).attr("draggable", true);
					$(lElement).attr("ondragstart", "event.dataTransfer.setData('payload', 'This text may be dragged')");
					$(lElement).addClass("draggable");

					var $timeout = $injector.get("$timeout");
					var isClonedDrag = attrs.hasOwnProperty("cloneable");

					lElement.on('mousedown', function(event) {
						$document.on('dragstart', dragstart);
						$document.one('dragend', dragend);
					});

					function dragstart(event) {
						event.originalEvent.dataTransfer.clearData("payload");
						event.originalEvent.dataTransfer.setData("payload", angular.toJson(scope.payload));
						if (scope.nestedPayload) {
							event.originalEvent.dataTransfer.clearData("payload-nested");
							event.originalEvent.dataTransfer.setData("payload-nested", angular.toJson(scope.nestedPayload));
						}

						event.originalEvent.dataTransfer.effectAllowed = "all";
						event.originalEvent.dataTransfer.dropEffect = "move";

						if (!attrs.hasOwnProperty("cloneable")) {
							scope.$apply(function() {
								if (typeof scope.nestedPayload !== "undefined") {
									scope.onDragStart(scope.nestedPayload);
								} else {
									scope.onDragStart(scope.payload);
								}
							});
						}
					}

					function dragend(event) {
						if (event.originalEvent.dataTransfer.dropEffect === "none") {
							scope.$apply(function() {
								if (typeof scope.nestedPayload !== "undefined") {
									scope.onDragFail(scope.nestedPayload);
								} else {
									scope.onDragFail(scope.payload);
								}
							});
						}

						$(".dragged-over").removeClass("dragged-over")

						event.originalEvent.dataTransfer.effectAllowed = "all";
						event.originalEvent.dataTransfer.dropEffect = "move";
						event.preventDefault();
					}

					scope.$on("$destroy", function() {
						$document.off('dragstart dragend');
					});

					return false;
				}
			};
		}
	};
}

function ngDroppable($injector) {
	return {
		restrict: "A",
		scope: {
			drop: "&"
		},
		link: function linkFn(scope, lElement, attrs) {
			var dragging = 0,
				elementRect = lElement[0].getBoundingClientRect(),
				dragDirection;

			$(lElement).attr("dropzone", 'link payload');
			$(lElement).attr("title", "Drop Category Here");
			$(lElement).addClass("droppable");

			lElement.on("dragover", function(event) {
				// only allow data events from data with transfer type = "payload"

				var elementTagName = event.target.tagName;

				if (event.originalEvent.dataTransfer.types, "payload, payload-nested" && elementTagName.toUpperCase() != "INPUT") {
					event.originalEvent.stopPropagation();
					event.stopPropagation();
					event.preventDefault();
					event.originalEvent.dataTransfer.effectAllowed = "all";
					event.originalEvent.dataTransfer.dropEffect = "move";
					lElement.addClass("dragged-over");
					return false;
				}

			});
			lElement.on("dragenter", function(event) {
				dragging++;
				event.originalEvent.stopPropagation();
				event.stopPropagation();
				event.preventDefault();
				event.originalEvent.dataTransfer.effectAllowed = "all";
				event.originalEvent.dataTransfer.dropEffect = "move";
				//event.target for dragenter is entering the droppable container. 
				// console.log(event);
				$(".dragged-over").removeClass("dragged-over");
				lElement.addClass("dragged-over");
				return false;
			});

			lElement.on("dragleave", function(event) {
				dragging--;
				event.preventDefault();
				event.originalEvent.stopPropagation();
				event.stopPropagation();
				event.originalEvent.dataTransfer.effectAllowed = "all";
				event.originalEvent.dataTransfer.dropEffect = "move";
				// console.log(event);
				if (dragging === 0) {
					lElement.removeClass("dragged-over");
				}
				return false;
			});

			lElement.on("drop", function(event) {
				scope.$apply(function() {
					var payload, nestedPayload;
					if (event.originalEvent.dataTransfer.getData("payload-nested") !== "undefined" && event.originalEvent.dataTransfer.getData("payload-nested") !== "") {
						nestedPayload = angular.fromJson(event.originalEvent.dataTransfer.getData("payload-nested"));
					} else {
						nestedPayload = event.originalEvent.dataTransfer.getData("payload-nested");
					}

					if (event.originalEvent.dataTransfer.getData("payload") !== "undefined") {
						payload = angular.fromJson(event.originalEvent.dataTransfer.getData("payload"));
					} else {
						payload = event.originalEvent.dataTransfer.getData("payload");
					}

					event.originalEvent.dataTransfer.dropEffect = "move";

					scope.drop({
						event: event,
						payload: payload,
						nestedPayload: nestedPayload
					});
				});

				lElement.removeClass("dragged-over");
				$(".dragged-over").removeClass("dragged-over")
				event.originalEvent.stopPropagation();
				event.originalEvent.preventDefault();
				event.stopPropagation();
				event.preventDefault();
				return false;
			});

			scope.$on("$destroy", function() {
				lElement.off('dragover dragenter drop dragleave');
			});

		}
	};
}