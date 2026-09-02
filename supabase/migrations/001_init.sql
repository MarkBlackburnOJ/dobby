-- Doddy session tracking: completely optional, gracefully degraded.
-- The app works offline and falls back to local state if Supabase is unconfigured.

CREATE TABLE IF NOT EXISTS verdicts (
  id BIGSERIAL PRIMARY KEY,
  text TEXT NOT NULL UNIQUE,
  tone TEXT NOT NULL CHECK (tone IN ('yes', 'no', 'maybe', 'chaotic')),
  weight INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  total_shakes INTEGER DEFAULT 0,
  total_damage NUMERIC DEFAULT 0,
  verdict_ids BIGINT[] DEFAULT '{}',
  final_mood TEXT
);

CREATE TABLE IF NOT EXISTS stats (
  key TEXT PRIMARY KEY,
  value NUMERIC NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: service role only (no anon access). Clients write only through API routes.
ALTER TABLE verdicts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No anon access" ON verdicts AS RESTRICTIVE FOR ALL TO anon USING (FALSE);
CREATE POLICY "No anon access" ON sessions AS RESTRICTIVE FOR ALL TO anon USING (FALSE);
CREATE POLICY "No anon access" ON stats AS RESTRICTIVE FOR ALL TO anon USING (FALSE);

-- Pre-seed with the local verdicts.
INSERT INTO verdicts (text, tone, weight) VALUES
('Aye. Now put me down.', 'yes', 3),
('Yes. Obviously yes. Was that worth a concussion?', 'yes', 2),
('Aye, do it. I''ve seen worse ideas. I''ve been worse ideas.', 'yes', 2),
('Yes — and I say that as a dwarf currently seeing four of you.', 'yes', 1),
('The runes say aye. The runes are also spinning. Mostly aye.', 'yes', 1),
('Go on then. Do it before I sober up and change my mind.', 'yes', 1),
('Aye. And when it works, you''ll not thank me. They never do.', 'yes', 1),
('Yes. I''d stake my beard on it, and that beard is all I have left.', 'yes', 1),
('Absolutely. Commit to the bit.', 'yes', 2),
('Aye, lad. The mountain agrees. The mountain also wants you to stop.', 'yes', 1),
('Yes. I felt it in my knees, which is where I feel everything now.', 'yes', 1),
('That''s a yes. Written in bruise, but a yes.', 'yes', 2),
('Do it. Worst case you end up in a jar like me.', 'yes', 1),
('Yes, and quickly, before someone sensible talks you out of it.', 'yes', 1),
('Aye. I''d have said so at a normal volume, mind.', 'yes', 1),
('Yes. The good kind of yes. Go.', 'yes', 1),
('No. Next question. Gentler.', 'no', 3),
('Nope. And I''d have told you that without the whiplash.', 'no', 2),
('No. Absolutely not. Put the phone down and think about your life.', 'no', 2),
('No. The stones say no. My spine says no. It''s unanimous.', 'no', 2),
('Under no circumstances. And I have agreed to some circumstances.', 'no', 1),
('No — and I''m being polite because there''s children present.', 'no', 1),
('Hard no. Softer shake next time, aye?', 'no', 2),
('No. I''ve watched a hundred fools try that. I buried ninety.', 'no', 1),
('Absolutely not, and now my hat''s inside out.', 'no', 1),
('No. Do the boring thing. The boring thing keeps you alive.', 'no', 2),
('No. And before you shake again — still no.', 'no', 2),
('That''s a no from me and a no from the beard.', 'no', 1),
('No. You knew that. You just wanted a dwarf to say it.', 'no', 2),
('No, and I''d like it noted that I said so before the ceiling hit me.', 'no', 1),
('Nay. Not today, not next Tuesday, not ever.', 'no', 1),
('Hmmmn. Ask me again when I can see straight.', 'maybe', 3),
('Could go either way. Like me, just now.', 'maybe', 2),
('Maybe. The vision was interrupted by my head hitting glass.', 'maybe', 2),
('Fifty-fifty. Same odds I make it through today.', 'maybe', 1),
('Unclear. There''s a fair bit of ringing in my ears.', 'maybe', 1),
('The omens are muddy. So am I. Related, probably.', 'maybe', 1),
('Possibly. Ask a better question and I''ll give a better answer.', 'maybe', 2),
('Mmmaybe. Depends entirely on things you''ve not told me.', 'maybe', 2),
('The runes landed on their edge. That''s your problem now.', 'maybe', 1),
('I want to say yes. My professional judgement says wait.', 'maybe', 2),
('Ask again in a week. I''ll be no wiser, but you might be.', 'maybe', 1),
('It''ll work. Not the way you''re imagining, mind.', 'maybe', 2),
('Signs point to ''you already decided and want permission''.', 'maybe', 2),
('I''m legally obliged to say ''consult a professional''. I am not one.', 'chaotic', 2),
('Wrong question. The real one''s the one you''re avoiding.', 'chaotic', 3),
('Sell everything. Move to the coast. Trust me, I''m a rock.', 'chaotic', 1),
('That''s between you and whatever you did last Tuesday.', 'chaotic', 2),
('The answer is ''seven''. I don''t make the rules. I just get shaken.', 'chaotic', 2),
('I saw your future. I''d like to un-see it, please.', 'chaotic', 2),
('Ask your mother. She already knows.', 'chaotic', 2),
('Yes, but not for the reason you think, and not with the person you think.', 'chaotic', 1),
('The spirits are on lunch. Try again in an hour.', 'chaotic', 1),
('I''ve been shaken so hard I''ve achieved enlightenment. It''s overrated. Do it.', 'chaotic', 1),
('New rule: one more question, then I''m calling my union.', 'chaotic', 2),
('Do it, but badly, and on purpose. Deniability, lad.', 'chaotic', 1),
('You get the answer you deserve, and you shook me like that.', 'chaotic', 2),
('Everything is fine. That''s not a prophecy, I''m just being kind.', 'chaotic', 1),
('The chamber has spoken. The chamber is a jar. Interpret freely.', 'chaotic', 1),
('I''d tell you, but you''d only shake me about it.', 'chaotic', 2)
ON CONFLICT (text) DO NOTHING;

INSERT INTO stats (key, value) VALUES
('total_sessions', 0),
('total_shakes', 0),
('total_damage', 0)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;
