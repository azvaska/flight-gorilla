-- DropForeignKey
ALTER TABLE "roles_users" DROP CONSTRAINT "fk_roles_users_role_id_role";

-- DropForeignKey
ALTER TABLE "roles_users" DROP CONSTRAINT "fk_roles_users_user_id_user";

-- AddForeignKey
ALTER TABLE "roles_users" ADD CONSTRAINT "fk_roles_users_role_id_role" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "roles_users" ADD CONSTRAINT "fk_roles_users_user_id_user" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION;
