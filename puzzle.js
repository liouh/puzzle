$(function() {

	var container = $('.container');

	var gridX = parseInt(getParameterByName('x')) || 6;
	var gridY = parseInt(getParameterByName('y')) || 5;
	
	var numElements = parseInt(getParameterByName('e')) || 6;
	
	var timeToMove = 6000;
	var timeSegments = 10;
	
	var counterWater = counterFire = counterEarth = counterLight = counterDark = counterHeart = 0;
	
	var gridSize,
		width,
		height,
		ratioX,
		ratioY,
		currentBlock,
		playAreaOffset,
		playAreaInactive,
		blocksSwapped,
		countdown,
		timeRemaining;
	
	var grid = [];
	
	function initialize() {
	
		initGrid();
		bindEvents();
		render();
	}

	function initGrid() {
	
		for(var x = 0; x < gridX; x++) {
			grid[x] = [];
			for(var y = 0; y < gridY; y++) {
				grid[x][y] = getRandomElement();
			}
		}
	}
	
	function render() {

		// init constants
		
		gridSize = Math.min(
			$('body').width() / gridX,
			$('body').height() / (gridY + 4)
		);
		
		width = gridX * gridSize;
		height = gridY * gridSize;
		
		ratioX = width / gridX;
		ratioY = height / gridY;
	
		// create display and play area
		
		var displayArea = $('<div class="display-area" />');
		displayArea.css({
			height: gridSize * 3,
			paddingTop: gridSize * 0.9,
			width: width,
			fontSize: gridSize * 0.65
		});
		
		displayArea.append($('<div class="counter water">' + counterWater + '</div>'));
		displayArea.append($('<div class="counter light">' + counterLight + '</div>'));
		displayArea.append($('<div class="counter fire">' + counterFire + '</div>'));
		displayArea.append($('<div class="counter dark">' + counterDark + '</div>'));
		displayArea.append($('<div class="counter earth">' + counterEarth + '</div>'));
		displayArea.append($('<div class="counter heart">' + counterHeart + '</div>'));
		
		displayArea.append($('<div class="countdown" />'));
		
		var playArea = $('<div class="play-area" />');
		playArea.css({
			height: height,
			width: width
		});
		
		container.empty().append(displayArea).append(playArea);
		
		playAreaOffset = $('.play-area').offset();
		
		for(var x = 0; x < gridX; x++) {
			for(var y = 0; y < gridY; y++) {
				var block = $('<div class="block" data-x="' + x + '" data-y="' + y + '"><div/></div>');
				block.css({
					left: x * ratioX + playAreaOffset.left,
					top: y * ratioY + playAreaOffset.top,
					width: ratioX,
					height: ratioY
				});
				block.addClass(grid[x][y]);
				$('.play-area').append(block);
			}
		}
	}
	
	function bindEvents() {
	
		$(window).on('resize', render);
		$(window).on('contextmenu', function() { return false; });
		
		// mouse
		$('body').on('mousedown', '.block', onBlockDown);
		$('body').on('mousemove', onBlockMove);
		$('body').on('mouseup', onBlockUp);
		
		// touch
		$('body').on('touchstart', '.block', onBlockDown);
		$('body').on('touchmove', onBlockMove);
		$('body').on('touchend', onBlockUp);
		
		// pointer
		$('body').on('pointerdown', '.block', onBlockDown);
		$('body').on('pointermove', onBlockMove);
		$('body').on('pointerup', onBlockUp);
	}
	
	function onBlockDown(e) {
		
		if(playAreaInactive) {
			return;
		}
		
		var block = $(e.currentTarget);
		currentBlock = block;
		currentBlock.addClass('active');
		
		$('.block').css('z-index', 1);
		currentBlock.css('z-index', 2);
	}
	
	function onBlockMove(e) {
		
		e.preventDefault();
		
		if(!currentBlock) {
			return;
		}
		
		// mouse
		var pointerX = e.pageX;
		var pointerY = e.pageY;
		
		if(!pointerX && !pointerY) {
			
			if(e.originalEvent.touches) {
				
				// touch
				pointerX = e.originalEvent.touches[0].pageX;
				pointerY = e.originalEvent.touches[0].pageY;
				
			} else {
				
				// pointer
				pointerX = e.originalEvent.pageX;
				pointerY = e.originalEvent.pageY;
			}
		}
		
		var playArea = $('.play-area');
		
		var xPos = pointerX - (gridSize / 2);
		var yPos = pointerY - (gridSize / 2);
		
		if(xPos > playAreaOffset.left - (gridSize / 2 - 1)
			&& yPos > playAreaOffset.top - (gridSize / 2 - 1)
			&& xPos < playArea.width() + playAreaOffset.left - gridSize + (gridSize / 2 - 1)
			&& yPos < playArea.height() + playAreaOffset.top - gridSize + (gridSize / 2 - 1)
		) {
			var location = getGridLocation(pointerX, pointerY);
			
			swapBlocks(currentBlock.attr('data-x'), currentBlock.attr('data-y'), location.x, location.y);
			
			currentBlock.css({
				left: xPos,
				top: yPos
			});
		}
		else {
			
			onBlockUp(e);
		}
	}
	
	function onBlockUp(e) {
		
		if(!currentBlock) {
			return;
		}
		
		clearInterval(countdown);
		$('.countdown').width('100%');
		
		currentBlock.removeClass('active').css({
			left: currentBlock.attr('data-x') * ratioX + playAreaOffset.left,
			top: currentBlock.attr('data-y') * ratioY + playAreaOffset.top
		});
		
		currentBlock = null;
		
		checkClearBlocks();
	}
	
	function checkClearBlocks() {
	
		if(!blocksSwapped) {
			return;
		}
		
		playAreaInactive = true;
		$('.play-area, .display-area').addClass('inactive');
		
		clearBlocks();
	}
	
	function clearBlocks() {
	
		var clear = [];
		
		for(var x = 0; x < gridX; x++) {
			clear[x] = [];
		}
		
		for(var x = 0; x < gridX; x++) {
			for(var y = 0; y < gridY; y++) {
				
				if(grid[x][y] == 'blank') {
					clear[x][y] = grid[x][y];
					continue;
				}
				
				if(y + 2 < gridY && grid[x][y] == grid[x][y + 1] && grid[x][y] == grid[x][y + 2]) {
					clear[x][y] = 'blank';
					clear[x][y + 1] = 'blank';
					clear[x][y + 2] = 'blank';
					$('[data-x=' + x + '][data-y=' + y + ']').addClass('blank');
					$('[data-x=' + x + '][data-y=' + (y + 1) + ']').addClass('blank');
					$('[data-x=' + x + '][data-y=' + (y + 2) + ']').addClass('blank');
				}
				if(x + 2 < gridX && grid[x][y] == grid[x + 1][y] && grid[x][y] == grid[x + 2][y]) {
					clear[x][y] = 'blank';
					clear[x + 1][y] = 'blank';
					clear[x + 2][y] = 'blank';
					$('[data-x=' + x + '][data-y=' + y + ']').addClass('blank');
					$('[data-x=' + (x + 1) + '][data-y=' + y + ']').addClass('blank');
					$('[data-x=' + (x + 2) + '][data-y=' + y + ']').addClass('blank');
				}
				
				if(!clear[x][y]) {
					clear[x][y] = grid[x][y];
				}
			}
		}
		grid = clear;
		
		var cleared = $('.block.blank').length;
		
		if(cleared) {
			
			setTimeout(function() { $('.block.blank').toggleClass('flash'); }, 100);
			setTimeout(function() { $('.block.blank').toggleClass('flash'); }, 200);
			setTimeout(function() { $('.block.blank').toggleClass('flash'); }, 300);
			
			setTimeout(function() {
				
				counterWater += $('.block.blank.water').length;
				$('.counter.water').text(counterWater);
				counterFire += $('.block.blank.fire').length;
				$('.counter.fire').text(counterFire);
				counterEarth += $('.block.blank.earth').length;
				$('.counter.earth').text(counterEarth);
				counterLight += $('.block.blank.light').length;
				$('.counter.light').text(counterLight);
				counterDark += $('.block.blank.dark').length;
				$('.counter.dark').text(counterDark);
				counterHeart += $('.block.blank.heart').length;
				$('.counter.heart').text(counterHeart);
				
				$('.block.blank').attr('class', 'block');
				dropBlocks();
			}, 400);
		
		} else {
			$('.play-area, .display-area').removeClass('inactive');
			playAreaInactive = false;
			blocksSwapped = false;
		}
	}
	
	function dropBlocks() {
	
		var dropped = false;
		for(var x = gridX - 1; x >= 0; x--) {
			for(var y = gridY - 1; y >= 0; y--) {
			
				if(grid[x][y] == 'blank' && y > 0 && grid[x][y - 1] != 'blank') {
				
					dropped = true;
					swapBlocks(x, y, x, y - 1);
				}
			}
		}
		
		if(dropped) {
			setTimeout(dropBlocks, 50);
		}
		else {
			setTimeout(fillBlocks, 50);
		}
	}
	
	function fillBlocks() {
	
		var filled = false;
		for(var x = 0; x < gridX; x++) {
			if(grid[x][0] == 'blank') {
			
				filled = true;
				var element = getRandomElement();
				grid[x][0] = element;
				$('[data-x=' + x + '][data-y=0]').css('top', -1 * ratioY + playAreaOffset.top).addClass(element);
			}
		}
	
		if(filled) {
			setTimeout(function() {
				$('[data-y=0]').css('top', playAreaOffset.top);
				dropBlocks();
			}, 50);
		} else {
			clearBlocks();
		}
	}
	
	function swapBlocks(activeX, activeY, passiveX, passiveY) {
		
		if(activeX == passiveX && activeY == passiveY) {
			return;
		}
		
		if(!blocksSwapped) {
			blocksSwapped = true;
			startCountdown();
		}
		
		var tmp = grid[activeX][activeY];
		grid[activeX][activeY] = grid[passiveX][passiveY];
		grid[passiveX][passiveY] = tmp;
		
		var active = $('[data-x=' + activeX + '][data-y=' + activeY + ']');
		var passive = $('[data-x=' + passiveX + '][data-y=' + passiveY + ']');
		
		active.attr('data-x', passiveX).attr('data-y', passiveY);
		passive.attr('data-x', activeX).attr('data-y', activeY);
		
		passive.css({
			left: activeX * ratioX + playAreaOffset.left,
			top: activeY * ratioY + playAreaOffset.top
		});
		
		if(grid[passiveX][passiveY] == 'blank') {
			active.css({
			//	left: passiveX * ratioX + playAreaOffset.left,
				top: passiveY * ratioY + playAreaOffset.top
			});
		}
	}
	
	function startCountdown() {
	
		timeRemaining = timeToMove;
		$('.countdown').width((timeRemaining - (timeToMove / timeSegments)) / timeToMove * 100 + '%');
		
		countdown = setInterval(function() {
			
			timeRemaining -= timeToMove / timeSegments;
			
			if(timeRemaining <= 0) {
				onBlockUp();
			} else {
				$('.countdown').width((timeRemaining - (timeToMove / timeSegments)) / timeToMove * 100 + '%');
			}
			
		}, timeToMove / timeSegments);
	}
	
	function getGridLocation(xPos, yPos) {
		
		xPos = xPos - playAreaOffset.left;
		yPos = yPos - playAreaOffset.top;
		
		xPos = Math.floor(xPos / ratioX);
		yPos = Math.floor(yPos / ratioY);
		
		return {x: xPos, y: yPos};
		
	}
	
	function getRandomElement() {
		
		var element = Math.floor(Math.random() * numElements);
		
		switch(element) {
		
			case 0: element = 'water'; break;
			case 1: element = 'fire'; break;
			case 2: element = 'earth'; break;
			case 3: element = 'light'; break;
			case 4: element = 'dark'; break;
			case 5: element = 'heart'; break;
		}
		
		return element;
	}
	
	function getParameterByName(name) {
	
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	
	initialize();
	
});