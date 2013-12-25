$(function() {

	var container = $('.container');

	var gridX = parseInt(getParameterByName('x')) || 6;
	var gridY = parseInt(getParameterByName('y')) || 5;
	
	var numElements = parseInt(getParameterByName('e')) || 6;
	
	var timeToMove = 6000;
	var timeSegments = 10;
	
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
		timeRemaining,
		lastCombo = 0,
		totalCombos = 0,
		totalTurns = 0;
	
	var grid = [];
	var counter = [];
	
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
			height: gridSize * 3.5,
			paddingTop: gridSize * 0.4,
			width: width,
			fontSize: gridSize * 0.4
		});
		
		for(var i = 0; i < numElements; i++) {
			if(counter[i] == null) {
				counter[i] = 0;
			}
			displayArea.append($('<div class="counter elem-' + i + '">' + counter[i] + '</div>'));
		}
		
		var comboDiv = $('<div class="last-combo" />');
		comboDiv.css({
			fontSize: gridSize * 1.4
		}).hide();
		
		var statsDiv = $('<div class="stats" />');
		statsDiv.css({
			fontSize: gridSize * 0.35
		});
		
		displayArea.append(statsDiv);
		displayArea.append($('<div class="countdown" />'));
		displayArea.append(comboDiv);
		
		
		var playArea = $('<div class="play-area" />');
		playArea.css({
			height: height,
			width: width
		});
		
		container.empty().append(displayArea).append(playArea);
		
		if(totalTurns > 0) {
			updateStats();
		}
		
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
				block.addClass('elem-' + grid[x][y]);
				$('.play-area').append(block);
			}
		}
	}
	
	function bindEvents() {
	
		$(window).on('resize', render);
		$(window).on('contextmenu', function() { return false; });
		$(window).on('mouseout', function(e) {
			if(e.relatedTarget == null || e.relatedTarget == $('html')[0]) {
				onBlockUp();
			}
		});
		
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
		
		var location = getGridLocation(pointerX, pointerY);
		
		swapBlocks(currentBlock.attr('data-x'), currentBlock.attr('data-y'), location.x, location.y);
		
		currentBlock.css({
			left: xPos,
			top: yPos
		});
	}
	
	function onBlockUp() {
		
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
		
		lastCombo = 0;
		
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
					clear[x][y] = grid[x][y] + 'blank';
					clear[x][y + 1] = grid[x][y] + 'blank';
					clear[x][y + 2] = grid[x][y] + 'blank';
					$('[data-x=' + x + '][data-y=' + y + ']').addClass('blank');
					$('[data-x=' + x + '][data-y=' + (y + 1) + ']').addClass('blank');
					$('[data-x=' + x + '][data-y=' + (y + 2) + ']').addClass('blank');
				}
				if(x + 2 < gridX && grid[x][y] == grid[x + 1][y] && grid[x][y] == grid[x + 2][y]) {
					clear[x][y] = grid[x][y] + 'blank';
					clear[x + 1][y] = grid[x][y] + 'blank';
					clear[x + 2][y] = grid[x][y] + 'blank';
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
			
			clearSection(false);
			
		} else {
			$('.play-area, .display-area').removeClass('inactive');
			playAreaInactive = false;
			blocksSwapped = false;
			
			totalCombos += lastCombo;
			totalTurns++;
			
			$('.last-combo').hide();
			
			updateStats();
		}
	}
	
	function findSection(x, y, e, next) {
		
		if(x < 0 || x >= gridX || y < 0 || y >= gridY || grid[x][y] != e) {
			return;
		}
		
		var elem = $('[data-x=' + x + '][data-y=' + y + ']');
		var delay = false;
		if(elem.hasClass('blank')) {
		
			grid[x][y] = 'blank';
			elem.removeClass('blank').addClass('flash');
			findSection(x - 1, y, e);
			findSection(x + 1, y, e);
			findSection(x, y - 1, e);
			findSection(x, y + 1, e);
			delay = true;
		}
		
		if(next) {
			
			clearSection(delay);
			
		}
	}
	
	function clearSection(delay) {
	
		if(delay) {
			
			lastCombo++;
			if(lastCombo > 1) {
				$('.last-combo').text(lastCombo).show();
			}
			
			setTimeout(function() { $('.block.flash').addClass('blink'); }, 80);
			setTimeout(function() { $('.block.flash').removeClass('blink'); }, 160);
			setTimeout(function() { $('.block.flash').addClass('blink'); }, 240);
			
			setTimeout(function() {
				
				for(var i = 0; i < numElements; i++) {
					counter[i] += $('.block.flash.elem-' + i).length;
					$('.counter.elem-' + i).text(counter[i]);
				}
				$('.block.flash').attr('class', 'block');
			
			}, 320);
		}
		
		delay = delay ? 400 : 0;
		
		setTimeout(function() {
			
			if($('.block.blank').length) {
				var block = $($('.block.blank')[0]);
				var x = parseInt(block.attr('data-x'));
				var y = parseInt(block.attr('data-y'));
				findSection(x, y, grid[x][y], true);
			}
			else {
				dropBlocks();
			}
		}, delay);
	}
	
	function dropBlocks() {
	
		var dropped = false;
		for(var x = 0; x < gridX; x++) {
			for(var y = gridY - 1; y >= 0; y--) {
			
				if(grid[x][y] == 'blank' && y > 0 && grid[x][y - 1] != 'blank') {
				
					dropped = true;
					swapBlocks(x, y, x, y - 1);
				}
			}
		}
		
		if(dropped) {
			setTimeout(dropBlocks, 20);
		}
		else {
			setTimeout(fillBlocks, 20);
		}
	}
	
	function fillBlocks() {
	
		var filled = false;
		for(var x = 0; x < gridX; x++) {
			if(grid[x][0] == 'blank') {
			
				filled = true;
				var element = getRandomElement();
				grid[x][0] = element;
				$('[data-x=' + x + '][data-y=0]').css('top', -1 * ratioY + playAreaOffset.top).addClass('elem-' + element);
			}
		}
	
		if(filled) {
			setTimeout(function() {
				$('[data-y=0]').css('top', playAreaOffset.top);
				dropBlocks();
			}, 80);
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
	
	function updateStats() {
	
		var totalMatches = 0;
		for(var i = 0; i < numElements; i++) {
			totalMatches += counter[i];
		}
	
		var html =  totalTurns + '<span>total turns</span>' +
					(totalCombos / totalTurns).toFixed(1) + '<span>combos / turn</span>' +
					(totalMatches / totalTurns).toFixed(1) + '<span>gems / turn</span>' +
					lastCombo + '<span>last combo</span>';
		
		$('.stats').html(html);
	}
	
	function getGridLocation(xPos, yPos) {
		
		xPos = xPos - playAreaOffset.left;
		yPos = yPos - playAreaOffset.top;
		
		xPos = Math.floor(xPos / ratioX);
		yPos = Math.floor(yPos / ratioY);
		
		if(xPos >= gridX) {
			xPos = gridX - 1;
		}
		else if(xPos < 0) {
			xPos = 0;
		} 
		
		if(yPos >= gridY) {
			yPos = gridY - 1;
		}
		else if(yPos < 0) {
			yPos = 0;
		}
		
		return {x: xPos, y: yPos};
		
	}
	
	function getRandomElement() {
		
		var element = Math.floor(Math.random() * numElements);
		
		return element;
	}
	
	function getParameterByName(name) {
	
		name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"), results = regex.exec(location.search);
		return results == null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
	}
	
	initialize();
	
});