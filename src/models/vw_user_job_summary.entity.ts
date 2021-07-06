import { ViewEntity, ViewColumn } from "typeorm";

@ViewEntity({
  name: 'vw_user_job_summary',
  expression: `
  SELECT profile.id,
  json_build_object('object', profile.avatar) AS avatar,
  profile.fullname,
  profile.phone_number,
  count(job.id) AS totaljob
 FROM user_profile profile
   LEFT JOIN dblink('jobserver'::text, 'SELECT id,user_id FROM job'::text) job(id integer, user_id integer) ON job.user_id = profile.id
GROUP BY profile.id, profile.avatar, profile.fullname, profile.phone_number;
  `
})
export class VwUserJobSummary {

  @ViewColumn({ name: 'id' })
  id!: string

  @ViewColumn({ name: 'avatar' })
  avatar!: {
    object: string | null
  }

  @ViewColumn({ name: 'fullname' })
  fullName!: string

  @ViewColumn({ name: 'phone_number' })
  phoneNumber!: string

  @ViewColumn({ name: 'totaljob' })
  totalJob!: number

}
