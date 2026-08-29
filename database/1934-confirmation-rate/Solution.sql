# Write your MySQL query statement below
select s.user_id,coalesce(round(sum(if(c.action ='confirmed',1,0))/count(c.user_id),2),0) AS confirmation_rate
from Signups s
left join Confirmations c on c.user_id=s.user_id
group by s.user_id
