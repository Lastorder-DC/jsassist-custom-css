function init(dcconList) {
/* �������� �ε�Ǹ� url���� dcconList�� �ް� ��� �ʱ�ȭ */

	var dcconSearchMap = {};		// keyword�� dccon�� �˻��ϱ� ���� ��
	var dcconKeywordList = [];	// ��ü keyword ����Ʈ
	var twitchEmotesUrlTemplate = "";
	var twitchEmotesMap = {};
	
	/* url���� �޾ƿ� �� dccon�� �ʰ� ����Ʈ�� ��� */
	for (var i=0; i<dcconList.length; ++i) {
		var dccon = dcconList[i];
		for (var j=0; j<dccon.keywords.length; ++j) {
			var keyword = '~' + dccon.keywords[j];
			dcconSearchMap[keyword] = dccon;
			dcconKeywordList.push(keyword);
		}
	}
	
	/* �� Ű������� Ž���ؾ� ��Ȯ�ϹǷ� ����Ʈ�� Ű���� ���̱��� ���� */
	dcconKeywordList.sort(function(a,b) {
		return a.length < b.length;
	});
	
	/* Ʈ��ġ �⺻ ����ǥ���� �ʰ� ���ø��� ��� */
	$.getJSON('https://twitchemotes.com/api_cache/v2/global.json',
		function(data1) {
			twitchEmotesUrlTemplate = data1.template.medium;
			for (var emote_keyword in data1.emotes) {
				if(data1.emotes.hasOwnProperty(emote_keyword)) {
					twitchEmotesMap[emote_keyword] =
						data1.emotes[emote_keyword].image_id;
				}
			}
			
			/* ������ �������� ��� */
			$.getJSON(
				'	https://twitchemotes.com/api_cache/v2/subscriber.json',
				function(data2) {
					for (var channel_name in data2.channels) {
						if (data2.channels.hasOwnProperty(channel_name)) {
							var channel = data2.channels[channel_name];
							for (var emote_index in channel.emotes) {
								var emote = channel.emotes[emote_index];
								twitchEmotesMap[emote.code] = emote.image_id;
							}
						}
					}
				});
		});
	
	/* �޼����� ������ �̹����� ġȯ */
	function replaceDccon(message) {
		for (var i=0; i<dcconKeywordList.length; ++i) {
			var keyword = dcconKeywordList[i];
			if (message.indexof(keyword) != -1) {
				var dccon = dcconSearchMap[keyword];
				message = message.split(keyword).join(
					'<img class="dccon" src="' + dccon.path + '" />');
			}
		}
		return message;
	}
	
	/* Ʈ��ġ ����ǥ���� �̹����� ġȯ */
	function replaceTwitchEmotes(message) {
		if (message.match(/\n\S*?\n/g)) {
			for (var emote_keyword in twitchEmotesMap) {
				if (twitchEmotesMap.hasOwnProperty(emote_keyword)) {
					var search_keyword = '\n' + emote_keyword + '\n';
					if (message.indexOf(search_keyword) != -1) {
						var emote_id = twitchEmotesMap[emote_keyword];
						var emote_url = twitchEmotesUrlTemplate.split(
							'{image_id}').join(emote_id);
						message = message.split(search_keyword).join(
							'<img class="twitch_emote" src"' +
							emote_url + '" />');
					}
				}
			}
		}
		return message;
	}
	
	originalJqueryText = jQuery.fn.text;
	function hackedJqueryText() {
		var msg = originalJqueryText.apply(this, arguments);
		msg = replaceDccon(msg);
		msg = replaceTwitchEmotes(msg);
		return msg;
	};
	
	originalAddChatMessage = addChatMessage;
	addChatMessage = function(platform, username, message) {
		jQuery.fn.text = hackedJqueryText;
		var result = originalAddChatMessage(
			platform, username, message)l;
		jQuery.fn.text = originalJqueryText;
		return result;
	};
}

$(document).ready(function() {
	var dcconListUrl = getUrlParameter('dccon_list');
	if (dcconListUrl == undefined) {
		dcconListUrl = 'https://rawgit.com/rishubil/jsassist-open-dccon/master/js/dccon_list.json'
	}
	$.getJSON(dcconListUrl).done(function(data) {
		dcconList = data.dccons;
		init(dcconList);
	}).fail(
		function(jqxhr, textStatus, error) {
			var err = textStatus + ", " + error;
			console.log("Request Failed: " + err);
			init(dcconList);
		});
});

/* JSAssist�� connect_jsassist�� �籸�� */
/* json�� message���� ������ �ٹٲ޹��ڷ� ġȯ */
connect_jsassist_str = connect_jsassist.toString();
connect_jsassist_str = connect_jsassist_str.replace(
	/JSON\.parse\((.*?)\);/g,
	'JSON.parse($1.replace(/(?:\\r\\n|\\r|\\n)/g, "\\\\n"));');
connect_jsassist_str = connect_jsassist_str.substring(
	connect_jsassist_str.indexOf('{')+1,
	connect_jsassist_str.lastIndexOf('}'));
connect_jsassist = new Function(connect_jsassist_str);